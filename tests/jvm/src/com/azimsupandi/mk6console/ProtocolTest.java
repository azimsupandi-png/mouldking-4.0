package com.azimsupandi.mk6console;

import java.util.Arrays;

/**
 * Protocol checks that need no Android: the connect telegram against the published capture
 * (J0EK3R/mkconnect-python README, MIT), channel and nibble mapping, 6.0 and 4.0 telegram
 * layout, and the connection log.
 */
public final class ProtocolTest {
    static int fails = 0;

    static void check(String name, boolean ok) {
        System.out.println((ok ? "PASS " : "FAIL ") + name);
        if (!ok) fails++;
    }

    static byte[] b(int... v) {
        byte[] o = new byte[v.length];
        for (int i = 0; i < v.length; i++) o[i] = (byte) v[i];
        return o;
    }

    static final byte[] ADDR = b(0xC1, 0xC2, 0xC3, 0xC4, 0xC5);

    public static void main(String[] args) {
        // MK 6.0 connect telegram, encrypted with the standard address and seed 37
        byte[] connect = b(0x6D, 0x7B, 0xA7, 0x80, 0x80, 0x80, 0x80, 0x92);
        String capture = "6D B6 43 CF 7E 8F 47 11 88 66 59 38 D1 7A AA 26 49 5E 13 14 15 16 17 18";
        check("6.0 connect matches the published capture", capture.equals(ConnLog.hex(Mk6Crypt.rfPayload(ADDR, connect, 37))));

        check("channel byte: stop is 128", Mk6Advertiser.channelByte(0) == 128);
        check("channel byte: tiny values stay in the dead zone", Mk6Advertiser.channelByte(1f) == 128 && Mk6Advertiser.channelByte(-1f) == 128);
        check("channel byte: full forward 255", Mk6Advertiser.channelByte(100) == 255);
        check("channel byte: full reverse 0", Mk6Advertiser.channelByte(-100) == 0);
        check("channel byte: half forward 192", Mk6Advertiser.channelByte(50) == 192);
        check("channel byte: half reverse 64", Mk6Advertiser.channelByte(-50) == 64);
        check("channel byte: over 100 is clamped", Mk6Advertiser.channelByte(250) == 255 && Mk6Advertiser.channelByte(-250) == 0);

        check("6.0 telegram, module 2: layout and check byte",
                Arrays.equals(Mk6Advertiser.telegram(1, new int[]{100, 0, 0, 0, 0, -100}),
                        b(0x62, 0x7B, 0xA7, 0xFF, 0x80, 0x80, 0x80, 0x80, 0x00, 0x9D)));
        check("6.0 telegram, module 1 and 3 ids",
                Mk6Advertiser.telegram(0, new int[6])[0] == 0x61 && Mk6Advertiser.telegram(2, new int[6])[0] == 0x63
                        && (Mk6Advertiser.telegram(2, new int[6])[9] & 0xFF) == 0x9C);

        check("4.0 nibble: stop 8", Mk6Advertiser.nibble4(0) == 8);
        check("4.0 nibble: full forward 15", Mk6Advertiser.nibble4(100) == 15);
        check("4.0 nibble: full reverse 7", Mk6Advertiser.nibble4(-100) == 7);
        check("4.0 nibble: half forward 11", Mk6Advertiser.nibble4(50) == 11);
        check("4.0 nibble: tiny values stop", Mk6Advertiser.nibble4(10) == 8 && Mk6Advertiser.nibble4(-10) == 8);

        int M = Mk6Advertiser.MK4;
        check("4.0 telegram, all stopped",
                Arrays.equals(Mk6Advertiser.telegram4(new int[]{M}, new int[][]{new int[6]}),
                        b(0x7D, 0x7B, 0xA7, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x82)));
        int[][] v = {{100, 0, 0, 0, 0, 0}, {0, 0, 0, -100, 0, 0}};
        byte[] t = Mk6Advertiser.telegram4(new int[]{M, M + 2}, v);
        check("4.0 telegram: module 1 port A is the high nibble of byte 3", (t[3] & 0xFF) == 0xF8);
        check("4.0 telegram: module 3 port D is the low nibble of byte 8", (t[8] & 0xFF) == 0x87);
        check("4.0 telegram: other bytes unchanged", (t[4] & 0xFF) == 0x88 && (t[5] & 0xFF) == 0x88 && (t[6] & 0xFF) == 0x88 && (t[7] & 0xFF) == 0x88);
        check("4.0 telegram ignores 6.0 slots",
                Arrays.equals(Mk6Advertiser.telegram4(new int[]{0}, new int[][]{{100, 100, 100, 100, 0, 0}}),
                        b(0x7D, 0x7B, 0xA7, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x82)));

        ConnLog.clear();
        ConnLog.add("first");
        ConnLog.add("second");
        String d = ConnLog.dump();
        check("log keeps lines in order", d.indexOf("first") >= 0 && d.indexOf("first") < d.indexOf("second"));
        check("log lines start with a time", d.matches("(?s)\\d\\d:\\d\\d:\\d\\d\\.\\d{3}  first\\n.*"));
        for (int i = 0; i < 400; i++) ConnLog.add("line " + i);
        check("log keeps the newest 300 lines", ConnLog.size() == 300 && ConnLog.dump().contains("line 399") && !ConnLog.dump().contains("line 50\n"));
        ConnLog.clear();
        check("log clears", ConnLog.size() == 0 && ConnLog.dump().isEmpty());
        check("hex helper", "0A FF 00".equals(ConnLog.hex(b(0x0A, 0xFF, 0x00))) && ConnLog.hex(null).isEmpty());

        System.out.println(fails == 0 ? "ALL PASS" : fails + " FAILED");
        System.exit(fails == 0 ? 0 : 1);
    }
}
