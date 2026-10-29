# -*- coding: utf-8 -*-
"""Đối chiếu entity JPA với schema thật trong PostgreSQL.

Hibernate chạy với ddl-auto: validate, nên bất kỳ chỗ lệch nào cũng làm ứng
dụng không khởi động được. Script này bắt lỗi đó trước khi chạy.

Chạy: python3 -I check_schema_mapping.py
"""
import re
import subprocess
import sys
from pathlib import Path

SRC = Path('/home/claude/work/scent/backend/src/main/java/vn/edu/uth/scentstation')
PSQL = ['psql', '-h', '/tmp', '-p', '55432', '-U', 'scent', '-d', 'scentstation', '-tAF|', '-c']

# Cột do BaseEntity khai báo, mọi entity đều có.
INHERITED = {'id', 'created_at', 'updated_at'}


def camel_to_snake(name):
    return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()


def db_columns():
    out = subprocess.run(
        PSQL + ["SELECT table_name, column_name, is_nullable FROM information_schema.columns "
                "WHERE table_schema='public' ORDER BY table_name, ordinal_position;"],
        capture_output=True, text=True, check=True).stdout
    tables = {}
    for line in out.strip().splitlines():
        table, column, nullable = line.split('|')
        tables.setdefault(table, {})[column] = (nullable == 'YES')
    return tables


def db_enum_checks():
    """Giá trị hợp lệ của mỗi cột enum, lấy từ ràng buộc CHECK."""
    out = subprocess.run(
        PSQL + ["SELECT rel.relname, pg_get_constraintdef(con.oid) "
                "FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid "
                "JOIN pg_namespace ns ON ns.oid = rel.relnamespace "
                "WHERE con.contype='c' AND ns.nspname='public';"],
        capture_output=True, text=True, check=True).stdout
    checks = {}
    for line in out.strip().splitlines():
        table, definition = line.split('|', 1)
        match = re.search(r'\(\(?(\w+)\)?::text = ANY \(\(?ARRAY\[(.+?)\]', definition)
        if match:
            column = match.group(1)
            values = set(re.findall(r"'([^']+)'", match.group(2)))
            checks[(table, column)] = values
    return checks


def parse_entities():
    """Mỗi entity: tên bảng, các cột, và tên enum của cột enum."""
    entities = []
    for path in SRC.rglob('*.java'):
        text = path.read_text(encoding='utf-8')
        if '@Entity' not in text:
            continue
        table = re.search(r'@Table\(name = "(\w+)"\)', text)
        if not table:
            print(f'  ! {path.name}: @Entity nhưng không có @Table')
            continue

        columns = []
        # @Column(name = "x") hoặc @Column(...) rồi tới tên trường
        for match in re.finditer(
                r'@(Column|JoinColumn)\(([^)]*)\)\s*(?:@\w+(?:\([^)]*\))?\s*)*'
                r'private\s+([\w<>, .]+?)\s+(\w+)\s*(?:=[^;]+)?;', text):
            anno, attrs, java_type, field = match.groups()
            named = re.search(r'name\s*=\s*"(\w+)"', attrs)
            column = named.group(1) if named else camel_to_snake(field)
            nullable_false = 'nullable = false' in attrs
            optional_false = False
            enum_type = None
            # Trường ngay trên có @Enumerated không?
            window = text[max(0, match.start() - 260):match.start()]
            if '@Enumerated' in window.split('@Column')[0] or '@Enumerated' in window:
                enum_type = java_type.strip()
            columns.append((column, field, nullable_false or optional_false, enum_type))

        entities.append((path, table.group(1), columns))
    return entities


def strip_comments(text):
    """Bỏ /* ... */ và // ... — nếu không, mã quy tắc như BR14 trong chú thích
    sẽ bị nhặt nhầm thành hằng số enum."""
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    return re.sub(r'//[^\n]*', '', text)


def enum_values(enum_name):
    for path in SRC.rglob(f'{enum_name}.java'):
        text = strip_comments(path.read_text(encoding='utf-8'))
        if not re.search(r'\benum\s+' + re.escape(enum_name) + r'\b', text):
            continue
        body = text.split('{', 1)[1] if '{' in text else ''
        body = body.split(';')[0]
        values = re.findall(r'\b([A-Z][A-Z0-9_]{2,})\b', body)
        if values:
            return set(values)
    return None


def main():
    tables = db_columns()
    checks = db_enum_checks()
    problems = []
    checked_columns = 0

    for path, table, columns in parse_entities():
        if table not in tables:
            problems.append(f'{path.name}: bảng "{table}" không có trong CSDL')
            continue

        for column, field, not_null, enum_type in columns:
            checked_columns += 1
            if column not in tables[table]:
                problems.append(
                    f'{path.name}: cột "{table}.{column}" (trường {field}) không có trong CSDL. '
                    f'Cột đang có: {", ".join(sorted(tables[table]))}')
                continue

            db_nullable = tables[table][column]
            if not_null and db_nullable:
                problems.append(
                    f'{path.name}: {table}.{column} khai báo nullable = false '
                    f'nhưng cột trong CSDL cho phép NULL')

            if enum_type:
                allowed = checks.get((table, column))
                declared = enum_values(enum_type)
                if allowed and declared and declared != allowed:
                    missing = declared - allowed
                    extra = allowed - declared
                    detail = []
                    if missing:
                        detail.append(f'enum có mà CHECK thiếu: {sorted(missing)}')
                    if extra:
                        detail.append(f'CHECK có mà enum thiếu: {sorted(extra)}')
                    problems.append(
                        f'{path.name}: {table}.{column} lệch giá trị enum {enum_type} — '
                        + '; '.join(detail))

    # Chiều ngược lại: cột NOT NULL không mặc định mà entity không hề nhắc tới
    mapped = {}
    for _, table, columns in parse_entities():
        mapped.setdefault(table, set()).update(c for c, _, _, _ in columns)
    for table, columns in tables.items():
        if table in ('flyway_schema_history', 'user_roles') or table not in mapped:
            continue
        for column, nullable in columns.items():
            if column in INHERITED or nullable or column in mapped[table]:
                continue
            problems.append(
                f'bảng {table}: cột NOT NULL "{column}" không entity nào ánh xạ — '
                f'thêm vào entity hoặc cho cột một giá trị mặc định')

    print(f'Đã kiểm {checked_columns} cột trên {len(parse_entities())} entity.')
    if problems:
        print(f'\n{len(problems)} chỗ lệch:')
        for problem in problems:
            print('  -', problem)
        sys.exit(1)
    print('Entity khớp hoàn toàn với schema.')


if __name__ == '__main__':
    main()
