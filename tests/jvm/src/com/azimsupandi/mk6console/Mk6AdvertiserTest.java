package com.azimsupandi.mk6console;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.le.AdvertisingSet;
import android.os.Handler;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Runs the real Mk6Advertiser against stubbed Android classes and a fake clock. */
public final class Mk6AdvertiserTest {
    static int fails = 0;
    static void check(String name, boolean ok) { System.out.println((ok ? "PASS " : "FAIL ") + name); if (!ok) fails++; }
    static byte[] neutral(int module) { return Mk6Crypt.rfPayload(new byte[]{(byte)0xC1,(byte)0xC2,(byte)0xC3,(byte)0xC4,(byte)0xC5}, Mk6Advertiser.telegram(module, new int[6]), 37); }
    static byte[] frameFor(int module, int[] ch) { return Mk6Crypt.rfPayload(new byte[]{(byte)0xC1,(byte)0xC2,(byte)0xC3,(byte)0xC4,(byte)0xC5}, Mk6Advertiser.telegram(module, ch), 37); }

    public static void main(String[] a) {
        BluetoothAdapter ad = new BluetoothAdapter();
        List<String> states = new ArrayList<>();
        Mk6Advertiser m = new Mk6Advertiser(ad, states::add);
        AdvertisingSet set = new AdvertisingSet();

        m.start(new int[]{0});
        ad.adv.started.get(0).onAdvertisingSetStarted(set, 0, 0);
        Handler.advance(10);
        check("connecting reported", states.contains("connecting"));
        Handler.advance(3100);
        check("ready after connect window", states.contains("ready"));

        // driving: frames keep arriving every 150 ms with a non-zero value
        int[] drive = {60, 0, 0, 0, 0, 0};
        for (int i = 0; i < 20; i++) { m.setFrame(drive); Handler.advance(150); }
        check("no watchdog while frames arrive", !states.contains("watchdog"));
        check("drive frame was sent", Arrays.equals(set.sent.get(set.sent.size() - 1), frameFor(0, drive)));

        // page freezes: no more frames (150 ms already passed since the last frame)
        Handler.advance(300);
        check("no watchdog before 500 ms", !states.contains("watchdog"));
        Handler.advance(200);
        check("watchdog after 500 ms without frames", states.contains("watchdog"));
        check("neutral frame sent by watchdog", Arrays.equals(set.sent.get(set.sent.size() - 1), neutral(0)));
        int n = set.sent.size();
        long wd = states.stream().filter("watchdog"::equals).count();
        Handler.advance(2000);
        check("watchdog reported once", states.stream().filter("watchdog"::equals).count() == wd);
        check("no extra frames while frozen", set.sent.size() == n);

        // page comes back and drives again
        m.setFrame(drive); Handler.advance(100);
        check("driving resumes after freeze", Arrays.equals(set.sent.get(set.sent.size() - 1), frameFor(0, drive)));

        // all-zero frames (idle): silence must not trigger the watchdog
        states.clear();
        m.setFrame(new int[6]); Handler.advance(5000);
        check("no watchdog when idle at zero", !states.contains("watchdog"));

        // diagnostics for the Hub screen
        String st = m.stats();
        check("stats: single-hub mode while running", st.contains("\"mode\":\"single\""));
        check("stats: counts frames from the page", st.matches(".*\"frames\":(2[0-9]|[3-9][0-9]|[1-9][0-9]{2,}),.*"));
        check("stats: counts the watchdog stop", st.contains("\"watchdog\":1,"));
        check("stats: last frame age known", !st.contains("\"lastFrameAgo\":-1"));

        // stop: neutral then stopped, watchdog off
        m.setFrame(drive); Handler.advance(100);
        m.stop(); Handler.advance(400);
        check("stopped after stop()", states.contains("stopped"));
        check("neutral sent before stop", Arrays.asList(set.sent.toArray(new byte[0][])).stream().anyMatch(b -> Arrays.equals(b, neutral(0))));
        states.clear(); Handler.advance(3000);
        check("no watchdog after stop", !states.contains("watchdog"));
        check("stats: mode off after stop", m.stats().contains("\"mode\":\"off\""));

        // two hubs on a phone with a single advertising set: rotation mode
        Handler.QUEUE.clear();
        BluetoothAdapter ad2 = new BluetoothAdapter();
        List<String> st2 = new ArrayList<>();
        Mk6Advertiser m2 = new Mk6Advertiser(ad2, st2::add);
        AdvertisingSet s2 = new AdvertisingSet();
        m2.start(new int[]{0, 1});
        ad2.adv.started.get(0).onAdvertisingSetStarted(s2, 0, 0);
        Handler.advance(3200);
        check("2 hubs: extra set requested", ad2.adv.started.size() == 2);
        ad2.adv.started.get(1).onAdvertisingSetStarted(null, 0, 1); // phone refuses a second set
        Handler.advance(10);
        int[] two = {50, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0};
        for (int i = 0; i < 10; i++) { m2.setFrame(two); Handler.advance(150); }
        check("rotation sends hub 1 frame", s2.sent.stream().anyMatch(b -> Arrays.equals(b, frameFor(0, new int[]{50,0,0,0,0,0}))));
        check("rotation sends hub 2 frame", s2.sent.stream().anyMatch(b -> Arrays.equals(b, frameFor(1, new int[]{0,40,0,0,0,0}))));
        Handler.advance(700);
        check("2 hubs: watchdog fires", st2.contains("watchdog"));
        int k = s2.sent.size();
        Handler.advance(400);
        List<byte[]> after = s2.sent.subList(k, s2.sent.size());
        check("2 hubs: both hubs get neutral after watchdog", after.stream().anyMatch(b -> Arrays.equals(b, neutral(0))) && after.stream().anyMatch(b -> Arrays.equals(b, neutral(1)))
            && after.stream().allMatch(b -> Arrays.equals(b, neutral(0)) || Arrays.equals(b, neutral(1))));

        // Mixed hubs at the same time: 4.0 on/off M1, 4.0 on/off M2 and 4.0 speed M3 all drive outputs together
        byte[] AD = {(byte)0xC1,(byte)0xC2,(byte)0xC3,(byte)0xC4,(byte)0xC5};
        int[] mods3 = {Mk6Advertiser.MK4OO, Mk6Advertiser.MK4OO + 1, Mk6Advertiser.MK4 + 2};
        int[] f3 = {100, 0, 100, 0, 0, 0,   0, 100, 0, 100, 0, 0,   0, 0, 100, 0, 0, 0};
        int[][] v3 = {{100, 0, 100, 0, 0, 0}, {0, 100, 0, 100, 0, 0}, {0, 0, 100, 0, 0, 0}};
        byte[] oo3 = Mk6Crypt.rfPayload(AD, Mk6Advertiser.telegramOO(mods3, v3), 37);
        byte[] mk3 = Mk6Crypt.rfPayload(AD, Mk6Advertiser.telegram4(mods3, v3), 37);
        check("mixed: on/off telegram carries both boxes at once", (Mk6Advertiser.telegramOO(mods3, v3)[3] & 0xFF) == 0x22 && (Mk6Advertiser.telegramOO(mods3, v3)[4] & 0xFF) == 0x88);
        BluetoothAdapter ad3 = new BluetoothAdapter();
        Mk6Advertiser m3 = new Mk6Advertiser(ad3, x -> {});
        AdvertisingSet p3 = new AdvertisingSet(), e1 = new AdvertisingSet(), e2 = new AdvertisingSet();
        m3.start(mods3);
        ad3.adv.started.get(0).onAdvertisingSetStarted(p3, 0, 0);
        Handler.advance(4200);
        check("mixed: two extra sets requested after the longer connect window", ad3.adv.started.size() == 3);
        ad3.adv.started.get(1).onAdvertisingSetStarted(e1, 0, 0);
        ad3.adv.started.get(2).onAdvertisingSetStarted(e2, 0, 0);
        Handler.advance(10);
        for (int i = 0; i < 6; i++) { m3.setFrame(f3); Handler.advance(150); }
        check("mixed parallel: hub 1 (on/off M1) set ends on the combined on/off telegram", Arrays.equals(p3.sent.get(p3.sent.size() - 1), oo3));
        check("mixed parallel: hub 2 (on/off M2) set ends on the same combined telegram", Arrays.equals(e1.sent.get(e1.sent.size() - 1), oo3));
        check("mixed parallel: hub 3 (4.0 M3) set ends on the 4.0 telegram", Arrays.equals(e2.sent.get(e2.sent.size() - 1), mk3));
        BluetoothAdapter ad4 = new BluetoothAdapter();
        Mk6Advertiser m4 = new Mk6Advertiser(ad4, x -> {});
        AdvertisingSet p4 = new AdvertisingSet();
        m4.start(mods3);
        ad4.adv.started.get(0).onAdvertisingSetStarted(p4, 0, 0);
        Handler.advance(4200);
        ad4.adv.started.get(1).onAdvertisingSetStarted(null, 0, 1);
        ad4.adv.started.get(2).onAdvertisingSetStarted(null, 0, 1);
        Handler.advance(10);
        for (int i = 0; i < 6; i++) { m4.setFrame(f3); Handler.advance(150); }
        List<byte[]> last = p4.sent.subList(Math.max(0, p4.sent.size() - 6), p4.sent.size());
        check("mixed rotation: both telegrams stay on air", last.stream().anyMatch(b -> Arrays.equals(b, oo3)) && last.stream().anyMatch(b -> Arrays.equals(b, mk3)));

        System.out.println(fails == 0 ? "ALL PASSED" : (fails + " FAILED"));
        System.exit(fails == 0 ? 0 : 1);
    }
}
