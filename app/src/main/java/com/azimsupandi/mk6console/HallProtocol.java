package com.azimsupandi.mk6console;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Text protocol of the Mould King H4.0 / H6.0 hubs (the 6-pin hubs that advertise as YX-01, YX-02,
 * YX-05 or YX-06 and are driven over a Bluetooth LE connection).
 *
 * Every message is ASCII: "T" + hex2(data length) + command + data + "W".
 * Documented by the OpenCrown project (MIT), see NOTICE. This is our own implementation.
 *
 *   1 connect   data AABB          2 disconnect       C heartbeat (reply: bit set = no smart motor)
 *   4 speed     per port: limit flag (1 hex) + speed (4 hex, bit 15 = reverse)
 *   3 position  per port: speed (4 hex, bit 15 = angle not negative) + |angle| (8 hex)
 *   8 set zero  port mask          A read position    9 end points   F stall protection
 */
final class HallProtocol {
    /** Parts of the GATT UUIDs that identify the hub's service and its write and notify channels. */
    static final String SERVICE_TAG = "ae3a";
    static final String WRITE_TAG = "ae3b";
    static final String NOTIFY_TAG = "ae3c";

    private HallProtocol() {}

    /** Number of ports for a hub name: YX-01 and YX-05 have 4, YX-02 and YX-06 have 6, else 0. */
    static int portsForName(String name) {
        if (name == null) return 0;
        String n = name.toUpperCase(Locale.US);
        if (n.startsWith("YX-01") || n.startsWith("YX-05")) return 4;
        if (n.startsWith("YX-02") || n.startsWith("YX-06")) return 6;
        return 0;
    }

    static String frame(String cmd, String data) {
        return "T" + String.format(Locale.US, "%02X", data.length() & 0xFF) + cmd + data + "W";
    }

    static String connect() { return frame("1", "AABB"); }
    static String disconnect() { return frame("2", ""); }
    static String heartbeat() { return frame("C", ""); }

    /** Stall ("rotation blocking") protection on or off. */
    static String stallProtection(boolean on) { return frame("F", on ? "1" : "0"); }

    /**
     * Heartbeat reply data: 2 hex digits, one bit per port. A set bit means there is NO smart motor
     * on that port. Returns, per port, whether a smart motor is plugged in, or null if unreadable.
     */
    static boolean[] smartPorts(String data, int ports) {
        if (data == null || data.length() < 2) return null;
        int v;
        try {
            v = Integer.parseInt(data.substring(0, 2), 16);
        } catch (NumberFormatException e) {
            return null;
        }
        boolean[] out = new boolean[ports];
        for (int i = 0; i < ports; i++) out[i] = ((v >> i) & 1) == 0;
        return out;
    }

    /** One port's speed field for a value -1..1; limited = the hub stops this port at its end points. */
    static String speedField(float v, boolean limited) {
        float c = Math.max(-1f, Math.min(1f, v));
        int mag = Math.max(0, Math.min(32767, (int) (Math.abs(c) * 32767f)));
        int raw = c >= 0f ? mag : mag + 0x8000;
        return (limited ? "1" : "0") + String.format(Locale.US, "%04X", raw);
    }

    /** Speed command for all ports (4 for an H4.0, 6 for an H6.0). */
    static String speed(float[] values, boolean[] limited) {
        StringBuilder b = new StringBuilder(values.length * 5);
        for (int i = 0; i < values.length; i++) {
            b.append(speedField(values[i], limited != null && i < limited.length && limited[i]));
        }
        return frame("4", b.toString());
    }

    /** Port bitmask as the hub uses it: A = 1, B = 2, C = 4 ... */
    static int mask(int port) { return 1 << port; }

    /** End points of one port in raw position units; values closer than 1000 to zero count as zero. */
    static String endPoints(int port, int a, int b) {
        int za = Math.abs(a) < 1000 ? 0 : a;
        int zb = Math.abs(b) < 1000 ? 0 : b;
        int hi = Math.max(za, zb), lo = Math.min(za, zb);
        return frame("9", String.format(Locale.US, "%02X", mask(port)) + signed(hi) + signed(lo));
    }

    private static String signed(int v) {
        return (v < 0 ? "-" : "+") + String.format(Locale.US, "%08X", Math.abs((long) v));
    }

    /** One port's field of the position command; speed 0 and angle 0 leaves the port alone. */
    static String angleField(int angle, int speed) {
        int s = angle >= 0 ? speed : -speed;
        s = Math.max(-32767, Math.min(32767, s));
        int sp = s < 0 ? -s : s + 0x8000;
        return String.format(Locale.US, "%04X", Math.min(sp, 0xFFFF)) + String.format(Locale.US, "%08X", Math.abs((long) angle));
    }

    /** Moves servo ports to absolute positions; a null target leaves that port alone. */
    static String angle(Integer[] targets, int[] speeds) {
        StringBuilder b = new StringBuilder(targets.length * 12);
        for (int i = 0; i < targets.length; i++) {
            b.append(targets[i] == null ? angleField(0, 0) : angleField(targets[i], speeds[i]));
        }
        return frame("3", b.toString());
    }

    static String setZero(int port) { return frame("8", String.format(Locale.US, "%02X", mask(port))); }
    static String readPosition(int port) { return frame("A", String.format(Locale.US, "%02X", mask(port))); }

    /** Servo speed in percent to hub speed units. */
    static int servoSpeed(int pct) { return (Math.max(1, Math.min(100, pct)) * 32767 + 99) / 100; }

    /** Position of a "read position" reply: {port digit, position}, or null. */
    static long[] parsePosition(String data) {
        if (data == null || data.length() < 10) return null;
        try {
            int p = Integer.parseInt(data.substring(0, 1), 16);
            long v = Long.parseLong(data.substring(2, 10), 16);
            return new long[]{p, data.charAt(1) == '-' ? -v : v};
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** A complete reply from the hub. */
    static final class Reply {
        final char cmd;
        final String data;
        Reply(char cmd, String data) { this.cmd = cmd; this.data = data; }
    }

    /** Pulls complete "T..W" frames out of a text buffer and leaves a partial frame in it. */
    static List<Reply> extract(StringBuilder buf) {
        List<Reply> out = new ArrayList<>();
        while (true) {
            int t = buf.indexOf("T");
            if (t < 0) { buf.setLength(0); break; }
            if (t > 0) buf.delete(0, t);
            if (buf.length() < 4) break;
            int len;
            try {
                len = Integer.parseInt(buf.substring(1, 3), 16);
            } catch (NumberFormatException e) {
                buf.deleteCharAt(0);
                continue;
            }
            int end = 4 + len;
            if (buf.length() <= end) break;
            if (buf.charAt(end) != 'W') { buf.deleteCharAt(0); continue; }
            out.add(new Reply(buf.charAt(3), buf.substring(4, end)));
            buf.delete(0, end + 1);
        }
        return out;
    }
}
