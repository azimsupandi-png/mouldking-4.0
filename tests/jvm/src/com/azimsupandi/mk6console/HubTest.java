package com.azimsupandi.mk6console;

public class HubTest {
    static int fails = 0;
    static void eq(String n, Object a, Object b) {
        if (!String.valueOf(a).equals(String.valueOf(b))) { fails++; System.out.println("FAIL " + n + ": got " + a + " want " + b); }
    }
    public static void main(String[] x) {
        eq("connect", HallProtocol.connect(), "T041AABBW");
        eq("disconnect", HallProtocol.disconnect(), "T002W");
        eq("heartbeat", HallProtocol.heartbeat(), "T00CW");
        eq("speed6", HallProtocol.speed(new float[6], null), "T1E4" + "00000".repeat(6) + "W");
        eq("speed4", HallProtocol.speed(new float[4], null), "T144" + "00000".repeat(4) + "W");
        eq("fwd", HallProtocol.speedField(1f, false), "07FFF");
        eq("rev", HallProtocol.speedField(-1f, false), "0FFFF");
        eq("rev half", HallProtocol.speedField(-0.5f, false), "0BFFF");
        eq("fwd half", HallProtocol.speedField(0.5f, false), "03FFF");
        eq("ports01", HallProtocol.portsForName("YX-01"), 4);
        eq("ports02", HallProtocol.portsForName("YX-02"), 6);
        eq("ports05", HallProtocol.portsForName("YX-05"), 4);
        eq("ports06", HallProtocol.portsForName("YX-06"), 6);
        eq("portsX", HallProtocol.portsForName("MK"), 0);
        HubSpec s = HubSpec.parse("0,H6=AA:BB:CC:DD:EE:FF,12");
        eq("spec ok", s != null, true);
        if (s != null) {
            eq("spec n", s.hubs.size(), 3);
            eq("spec hall", s.hallCount(), 1);
            eq("spec adv", s.advMods().length, 2);
            eq("spec ports", s.hubs.get(1).ports, 6);
        }
        HubSpec o = HubSpec.parse("20,21,10");
        eq("spec on/off ok", o != null, true);
        if (o != null) {
            eq("spec on/off ports", o.hubs.get(0).ports, 4);
            eq("spec on/off adv", o.advMods().length, 3);
        }
        eq("spec on/off out of range", HubSpec.parse("23"), null);
        eq("spec between ranges", HubSpec.parse("15"), null);
        eq("dup", HubSpec.parse("0,0"), null);
        eq("four", HubSpec.parse("0,1,2,10"), null);
        eq("bad", HubSpec.parse("H4=zz"), null);
        eq("null", HubSpec.parse(null), null);
        System.out.println(fails == 0 ? "HubTest ALL PASS" : "HubTest FAILURES " + fails);
        if (fails > 0) System.exit(1);
    }
}
