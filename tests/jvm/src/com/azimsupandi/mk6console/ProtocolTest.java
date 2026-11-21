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
        int defaultCode = Mk6Advertiser.mk4Rev, defaultOo = Mk6Advertiser.ooRev;
        Mk6Advertiser.setReverseCodes(0, 0); // the nibble checks below are written for code A
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

        // Older 4.0 on/off boxes (OpenCrown "MK4OO"): two bits per port, one byte per module
        int O = Mk6Advertiser.MK4OO;
        check("4.0 on/off telegram, all stopped",
                Arrays.equals(Mk6Advertiser.telegramOO(new int[]{O}, new int[][]{new int[6]}),
                        b(0x77, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x88)));
        byte[] oo = Mk6Advertiser.telegramOO(new int[]{O, O + 1, M},
                new int[][]{{100, -100, 0, 50, 0, 0}, {0, 0, -60, 0, 0, 0}, {100, 100, 100, 100, 0, 0}});
        check("4.0 on/off: module 1 A forward, B reverse, D forward = 0x4A", (oo[3] & 0xFF) == 0x4A);
        check("4.0 on/off: module 2 C reverse = 0x10", (oo[4] & 0xFF) == 0x10);
        check("4.0 on/off: module 3 untouched, speed-control 4.0 slot ignored", oo[5] == 0);
        check("4.0 on/off: small values stay off",
                Mk6Advertiser.telegramOO(new int[]{O}, new int[][]{{15, -15, 20, -20, 0, 0}})[3] == 0);
        check("4.0 speed telegram ignores on/off slots",
                Arrays.equals(Mk6Advertiser.telegram4(new int[]{O}, new int[][]{{100, 100, 100, 100, 0, 0}}),
                        b(0x7D, 0x7B, 0xA7, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x82)));
        byte[][] cs = Mk6Advertiser.connectsFor(new int[]{O, O + 1, M});
        check("connect: two on/off boxes and a 4.0 hub = 4.0 then on/off connect",
                cs.length == 2 && (cs[0][0] & 0xFF) == 0xAD
                        && Arrays.equals(cs[1], b(0xAA, 0x00, 0x00, 0x80, 0x80, 0x80, 0x00, 0x55)));
        check("connect: a single 6.0 hub = 6.0 connect only",
                Mk6Advertiser.connectsFor(new int[]{0}).length == 1 && Mk6Advertiser.connectsFor(new int[]{0})[0][0] == 0x6D);
        check("connect: 6.0, 4.0 and on/off = three telegrams", Mk6Advertiser.connectsFor(new int[]{0, M, O}).length == 3);

        // Reverse codes to try on real 4.0 hubs
        check("default codes are the ones found on real hubs: 4.0 sign bit (C), on/off reverse bit (A)", defaultCode == 2 && defaultOo == 0);
        check("code A: full reverse = 7, full forward = 15", Mk6Advertiser.nibble4(-100) == 7 && Mk6Advertiser.nibble4(100) == 15);
        Mk6Advertiser.setReverseCodes(1, 1);
        check("code B: mirrored, full reverse = 1, one step back = 7, forward unchanged",
                Mk6Advertiser.nibble4(-100) == 1 && Mk6Advertiser.nibble4(-15) == 7 && Mk6Advertiser.nibble4(100) == 15 && Mk6Advertiser.nibble4(0) == 8);
        check("on/off code B: reverse sets both bits of the port (A = 0x03)",
                (Mk6Advertiser.telegramOO(new int[]{Mk6Advertiser.MK4OO}, new int[][]{{-100, 0, 0, 0, 0, 0}})[3] & 0xFF) == 0x03);
        check("on/off code B: forward still only the forward bit (A = 0x02)",
                (Mk6Advertiser.telegramOO(new int[]{Mk6Advertiser.MK4OO}, new int[][]{{100, 0, 0, 0, 0, 0}})[3] & 0xFF) == 0x02);
        Mk6Advertiser.setReverseCodes(2, 0);
        check("code C: forward 1..7, reverse 9..15", Mk6Advertiser.nibble4(100) == 7 && Mk6Advertiser.nibble4(-100) == 15 && Mk6Advertiser.nibble4(-15) == 9 && Mk6Advertiser.nibble4(0) == 8);
        Mk6Advertiser.setReverseCodes(9, 9);
        check("unknown codes fall back to the defaults (C, A)", Mk6Advertiser.mk4Rev == 2 && Mk6Advertiser.ooRev == 0 && Mk6Advertiser.nibble4(-100) == 15 && Mk6Advertiser.nibble4(100) == 7);
        Mk6Advertiser.setReverseCodes(0, 0);

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
