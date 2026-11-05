#!/usr/bin/env python3
"""Compare the JPA entities against the schema the migrations actually built.

The application runs with ``ddl-auto: validate``, so a single disagreement
between an entity and its table stops Spring from starting, with a message
that names one column and not the rest. This script reports all of them at
once, against a live database, before anyone waits for a failed start-up.

It is the check behind the "done when" of task M1: *the application starts
with ddl-auto: validate and reports no schema drift*.

What it compares, per entity:

* the table exists;
* every mapped column exists, including the primary key under whatever name
  ``@AttributeOverride`` gave it and the foreign keys from ``@JoinColumn``;
* the SQL type is one Hibernate would accept for the Java type;
* a column the entity declares ``nullable = false`` is NOT NULL in the
  database, so a missing value fails on insert rather than silently passing;
* for an ``@Enumerated(EnumType.STRING)`` field, the enum's constants and the
  column's CHECK constraint list exactly the same values.

Usage:

    python3 -I tools/check_schema_mapping.py [database] [--quiet]

Defaults to the database ``scentstation`` on localhost:55432 as user
``scent``; override with SCENT_PGHOST, SCENT_PGPORT and SCENT_PGUSER.
"""

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "backend/src/main/java/vn/edu/uth/scentstation"

DATABASE = "scentstation"
QUIET = False
for arg in sys.argv[1:]:
    if arg == "--quiet":
        QUIET = True
    elif not arg.startswith("-"):
        DATABASE = arg

PSQL = [
    "psql",
    "-h", os.environ.get("SCENT_PGHOST", "localhost"),
    "-p", os.environ.get("SCENT_PGPORT", "55432"),
    "-U", os.environ.get("SCENT_PGUSER", "scent"),
    "-d", DATABASE,
    "-tAF|", "-v", "ON_ERROR_STOP=1", "-c",
]

# Which SQL types Hibernate will accept for which Java type. Hibernate compares
# JDBC type codes, so several SQL spellings map to one Java type.
TYPES = {
    "String": {"character varying", "text", "character"},
    "int": {"integer"},
    "Integer": {"integer"},
    "long": {"bigint"},
    "Long": {"bigint"},
    "short": {"smallint"},
    "boolean": {"boolean"},
    "Boolean": {"boolean"},
    "BigDecimal": {"numeric"},
    "Instant": {"timestamp with time zone"},
    "LocalDate": {"date"},
    "LocalDateTime": {"timestamp without time zone"},
}

# A @ManyToOne to another entity is a bigint foreign key.
RELATION_TYPE = {"bigint"}


def query(sql):
    result = subprocess.run(PSQL + [sql], capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"psql failed against database '{DATABASE}':\n{result.stderr.strip()}")
    return [line.split("|") for line in result.stdout.strip().splitlines() if line]


def db_columns():
    rows = query(
        "SELECT table_name, column_name, data_type, is_nullable "
        "FROM information_schema.columns WHERE table_schema = 'public' "
        "ORDER BY table_name, ordinal_position;")
    tables = {}
    for table, column, data_type, nullable in rows:
        tables.setdefault(table, {})[column] = (data_type, nullable == "YES")
    return tables


def db_check_values():
    """The values each CHECK constraint allows, per table."""
    rows = query(
        "SELECT rel.relname, pg_get_constraintdef(con.oid) FROM pg_constraint con "
        "JOIN pg_class rel ON rel.oid = con.conrelid "
        "JOIN pg_namespace ns ON ns.oid = rel.relnamespace "
        "WHERE con.contype = 'c' AND ns.nspname = 'public';")
    checks = {}
    for table, definition in rows:
        # PostgreSQL renders the literals with a cast whose spelling depends on
        # the column type: ARRAY['ACTIVE'::character varying, ...] for a
        # VARCHAR column, ::text for a TEXT one.
        values = set(re.findall(
            r"'([A-Z][A-Z0-9_]*)'::(?:text|character varying|bpchar|character)", definition))
        if values:
            checks.setdefault(table, []).append(values)
    return checks


def enum_constants(name):
    """The constants of one of our own enums, found by file name."""
    for path in SRC.rglob(f"{name}.java"):
        # Comments go first. A Javadoc block holds braces of its own, in
        # {@link ...}, and prose such as "(BR9)" reads exactly like a constant,
        # so splitting before stripping finds words that are not there.
        text = strip_comments(path.read_text(encoding="utf-8"))
        declaration = re.search(r"\benum\s+" + name + r"\b[^{]*\{", text)
        if not declaration:
            continue
        body = text[declaration.end():]
        body = re.split(r"[;}]", body)[0]
        found = re.findall(r"\b([A-Z][A-Z0-9_]+)\b", body)
        if found:
            return set(found)
    return None


def strip_comments(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"//[^\n]*", "", text)


def camel_to_snake(name):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def parse_entity(path):
    """Everything this file says about how it maps onto a table."""
    raw = path.read_text(encoding="utf-8")
    text = strip_comments(raw)
    if "@Entity" not in text:
        return None

    table = re.search(r'@Table\(name\s*=\s*"([a-z_]+)"\)', text)
    if not table:
        return None

    entity = {
        "file": path.relative_to(ROOT),
        "name": path.stem,
        "table": table.group(1),
        "columns": [],      # (column, java_type, nullable_allowed, enum_name)
    }

    # The primary key, renamed per entity by @AttributeOverride.
    override = re.search(
        r'@AttributeOverride\(\s*name\s*=\s*"id"\s*,\s*column\s*=\s*@Column\(name\s*=\s*"([a-z_]+)"\)',
        text)
    entity["columns"].append((override.group(1) if override else "id", "Long", False, None))

    # created_at comes from TimestampedEntity; BaseEntity carries no timestamp.
    if re.search(r"extends\s+TimestampedEntity\b", text):
        entity["columns"].append(("created_at", "Instant", False, None))

    # Field declarations, each with the annotations written above it.
    body = text.split("{", 1)[1]
    for match in re.finditer(
            r"((?:@[A-Za-z]+(?:\([^()]*(?:\([^()]*\)[^()]*)*\))?\s*)*)"
            r"private\s+(?:final\s+)?([A-Za-z0-9_<>, .]+?)\s+([A-Za-z0-9_]+)\s*(?:=|;)",
            body):
        annotations, java_type, field = match.group(1), match.group(2).strip(), match.group(3)

        if "@Transient" in annotations:
            continue
        # A @ManyToMany lives in its own join table, not in a column here.
        if "@ManyToMany" in annotations or "@OneToMany" in annotations:
            continue
        if "@" not in annotations:
            continue  # not a mapped field

        named = re.search(r'@(?:Join)?Column\(\s*(?:[^()]*?,\s*)?name\s*=\s*"([a-z_]+)"', annotations)
        column = named.group(1) if named else camel_to_snake(field)

        nullable_allowed = "nullable = false" not in annotations
        if "@JoinColumn" in annotations and "optional = false" in annotations:
            nullable_allowed = False

        enum_name = None
        if "@Enumerated" in annotations:
            enum_name = java_type
            java_type = "String"
        elif java_type not in TYPES:
            java_type = "_relation_"   # @ManyToOne to another entity

        entity["columns"].append((column, java_type, nullable_allowed, enum_name))

    return entity


def main():
    tables = db_columns()
    checks = db_check_values()

    entities = []
    for path in sorted(SRC.rglob("*.java")):
        parsed = parse_entity(path)
        if parsed:
            entities.append(parsed)

    problems = []
    checked_columns = 0

    for entity in entities:
        table = entity["table"]
        if table not in tables:
            problems.append(f"{entity['name']}: table '{table}' does not exist")
            continue
        actual = tables[table]

        for column, java_type, nullable_allowed, enum_name in entity["columns"]:
            checked_columns += 1
            where = f"{entity['name']}.{column}"

            if column not in actual:
                problems.append(
                    f"{where}: no such column in '{table}' "
                    f"(it has {', '.join(sorted(actual))})")
                continue

            data_type, db_nullable = actual[column]

            expected = RELATION_TYPE if java_type == "_relation_" else TYPES[java_type]
            if data_type not in expected:
                problems.append(
                    f"{where}: mapped as {java_type} but the column is {data_type} "
                    f"(expected one of {', '.join(sorted(expected))})")

            if not nullable_allowed and db_nullable:
                problems.append(
                    f"{where}: the entity says nullable = false but the column allows NULL")

            if enum_name:
                constants = enum_constants(enum_name)
                if constants is None:
                    problems.append(f"{where}: enum {enum_name} not found in the sources")
                else:
                    matching = [v for v in checks.get(table, []) if v & constants]
                    if not matching:
                        problems.append(
                            f"{where}: no CHECK constraint guards this enum column, so the "
                            f"database would accept a value {enum_name} cannot map")
                    else:
                        allowed = matching[0]
                        if allowed != constants:
                            problems.append(
                                f"{where}: {enum_name} has {sorted(constants)} but the CHECK "
                                f"constraint allows {sorted(allowed)}")

    if not QUIET:
        for entity in entities:
            print(f"  {entity['name']:22s} -> {entity['table']:20s} "
                  f"{len(entity['columns'])} columns")

    print(f"\n{len(entities)} entities, {checked_columns} columns checked "
          f"against database '{DATABASE}'")

    if problems:
        print(f"\n{len(problems)} problem(s):")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    print("No drift: every entity matches its table, and every enum matches its CHECK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
