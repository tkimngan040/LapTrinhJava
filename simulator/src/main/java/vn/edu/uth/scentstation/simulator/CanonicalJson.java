package vn.edu.uth.scentstation.simulator;

import java.util.Map;
import java.util.TreeMap;

/**
 * Serialises a flat map to JSON with the keys in alphabetical order.
 *
 * <p>An HMAC is computed over bytes, so both sides must build byte-for-byte the
 * same string from the same fields. Ordinary JSON writers give no such promise:
 * key order follows insertion or reflection, and one extra space makes the
 * signature fail. Hence this deliberately small, deliberately strict writer.
 *
 * <p><strong>This file is duplicated from the backend project and the two
 * copies must stay identical.</strong> Changing one without the other breaks
 * every signature, and the symptom (every command rejected) points nowhere
 * near the cause.
 *
 * <p>Only the value types a command payload actually uses are accepted:
 * string, integer, decimal, boolean and null. Anything else is refused loudly
 * rather than silently serialised in a way the other side may not match.
 */
public final class CanonicalJson {

    private CanonicalJson() {
    }

    public static String write(Map<String, Object> fields) {
        StringBuilder out = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : new TreeMap<>(fields).entrySet()) {
            if (!first) {
                out.append(',');
            }
            first = false;
            out.append('"').append(escape(entry.getKey())).append("\":");
            appendValue(out, entry.getValue());
        }
        return out.append('}').toString();
    }

    private static void appendValue(StringBuilder out, Object value) {
        if (value == null) {
            out.append("null");
        } else if (value instanceof String text) {
            out.append('"').append(escape(text)).append('"');
        } else if (value instanceof Boolean flag) {
            out.append(flag.booleanValue());
        } else if (value instanceof Integer || value instanceof Long
                || value instanceof Short || value instanceof Byte) {
            out.append(((Number) value).longValue());
        } else {
            throw new IllegalArgumentException(
                    "Unsupported value type in a signed payload: " + value.getClass().getName()
                            + ". Use String, an integer type, Boolean or null.");
        }
    }

    private static String escape(String text) {
        StringBuilder out = new StringBuilder(text.length() + 8);
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            switch (ch) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                case '\b' -> out.append("\\b");
                case '\f' -> out.append("\\f");
                default -> {
                    if (ch < 0x20) {
                        out.append(String.format("\\u%04x", (int) ch));
                    } else {
                        out.append(ch);
                    }
                }
            }
        }
        return out.toString();
    }
}
