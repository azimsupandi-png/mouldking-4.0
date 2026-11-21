package com.azimsupandi.mk6console;

import java.util.ArrayDeque;
import java.util.Calendar;
import java.util.Locale;

/**
 * Rolling connection log (newest lines kept). The app shows it on Home so a problem can be copied
 * and sent. Thread safe, no Android classes, so the JVM tests can read it.
 */
final class ConnLog {
    private static final int MAX = 300;
    private static final ArrayDeque<String> LINES = new ArrayDeque<>();
    private static long lastAt;

    private ConnLog() {}

    static synchronized void add(String msg) {
        lastAt = System.currentTimeMillis();
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(lastAt);
        String t = String.format(Locale.US, "%02d:%02d:%02d.%03d", c.get(Calendar.HOUR_OF_DAY),
                c.get(Calendar.MINUTE), c.get(Calendar.SECOND), c.get(Calendar.MILLISECOND));
        if (LINES.size() >= MAX) LINES.removeFirst();
        LINES.addLast(t + "  " + msg);
    }

    static synchronized String dump() {
        StringBuilder b = new StringBuilder(LINES.size() * 48);
        for (String s : LINES) b.append(s).append('\n');
        return b.toString();
    }

    static synchronized int size() {
        return LINES.size();
    }

    static synchronized void clear() {
        LINES.clear();
    }

    /** Space separated hex of the bytes, for telegrams and advertising data. */
    static String hex(byte[] b) {
        if (b == null) return "";
        StringBuilder s = new StringBuilder(b.length * 3);
        for (int i = 0; i < b.length; i++) {
            if (i > 0) s.append(' ');
            s.append(String.format(Locale.US, "%02X", b[i] & 0xFF));
        }
        return s.toString();
    }
}
