package com.azimsupandi.mk6console;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * The list of hubs the page asks the app to drive, from the text it passes to start().
 * Items are separated by commas and keep the order of the page's hubs (and of the frame):
 *   "0" 6.0 hub module 1..3 (0..2),  "10" 4.0 hub module 1..3 (10..12),
 *   "H4=AA:BB:CC:DD:EE:FF" or "H6=AA:BB:CC:DD:EE:FF" an H4.0 or H6.0 hub at that Bluetooth address.
 */
final class HubSpec {
    static final class Hub {
        /** Advertising module code (0..2 for 6.0, 10..12 for 4.0), or -1 for a hub with a connection. */
        final int adv;
        final String addr;
        final int ports;

        Hub(int adv, String addr, int ports) {
            this.adv = adv;
            this.addr = addr;
            this.ports = ports;
        }

        boolean isHall() { return adv < 0; }
    }

    final List<Hub> hubs = new ArrayList<>();

    /** @return null when the text is not a valid list of one to three different hubs */
    static HubSpec parse(String text) {
        if (text == null) return null;
        String[] parts = text.split(",");
        if (parts.length < 1 || parts.length > 3) return null;
        HubSpec s = new HubSpec();
        for (String raw : parts) {
            String p = raw.trim();
            Hub h;
            if (p.startsWith("H4=") || p.startsWith("H6=")) {
                String a = p.substring(3).toUpperCase(Locale.US);
                if (!a.matches("([0-9A-F]{2}:){5}[0-9A-F]{2}")) return null;
                h = new Hub(-1, a, p.charAt(1) == '4' ? 4 : 6);
            } else {
                int v;
                try {
                    v = Integer.parseInt(p);
                } catch (NumberFormatException e) {
                    return null;
                }
                if (!((v >= 0 && v <= 2) || (v >= Mk6Advertiser.MK4 && v <= Mk6Advertiser.MK4 + 2))) return null;
                h = new Hub(v, null, v >= Mk6Advertiser.MK4 ? 4 : 6);
            }
            for (Hub o : s.hubs) {
                if (h.isHall() ? (o.isHall() && o.addr.equals(h.addr)) : o.adv == h.adv) return null;
            }
            s.hubs.add(h);
        }
        return s;
    }

    /** Advertising module codes in page order. */
    int[] advMods() {
        int n = 0;
        for (Hub h : hubs) if (!h.isHall()) n++;
        int[] o = new int[n];
        int i = 0;
        for (Hub h : hubs) if (!h.isHall()) o[i++] = h.adv;
        return o;
    }

    int hallCount() {
        int n = 0;
        for (Hub h : hubs) if (h.isHall()) n++;
        return n;
    }
}
