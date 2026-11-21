package com.azimsupandi.mk6console;

import android.bluetooth.BluetoothAdapter;
import android.content.Context;
import android.os.SystemClock;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * The link to all hubs of a model: the Bluetooth advertising hubs (6.0 and 4.0 modules, see
 * {@link Mk6Advertiser}) and the hubs with a Bluetooth connection (H4.0 / H6.0, see {@link HallHub}).
 * All calls and callbacks are on the main thread.
 *
 * States reported to the listener: connecting, ready, stopped, off, denied, unsupported, error and
 * watchdog (one of the safety watchdogs stopped the outputs).
 */
final class HubLink {
    interface Listener {
        void onState(String state);
    }

    private final Context context;
    private final BluetoothAdapter adapter;
    private final Listener listener;

    private HubSpec spec;
    private Mk6Advertiser adv;
    private final List<HallHub> halls = new ArrayList<>();
    private boolean[][] smart;
    private boolean running;
    private boolean stopping;
    private boolean silent;
    private boolean advReady;
    private boolean advDone;
    private int hallReady;
    private int hallDone;
    private long statFrames;
    private long statStartedAt;
    private long lastFrameAt;

    HubLink(Context context, BluetoothAdapter adapter, Listener listener) {
        this.context = context;
        this.adapter = adapter;
        this.listener = listener;
    }

    boolean isActive() {
        return running || (adv != null && adv.isActive());
    }

    void start(HubSpec s) {
        if (running) {
            ConnLog.add("Start ignored: link already running");
            return;
        }
        spec = s;
        running = true;
        stopping = false;
        silent = false;
        advReady = false;
        advDone = false;
        hallReady = 0;
        hallDone = 0;
        statFrames = 0;
        statStartedAt = SystemClock.uptimeMillis();
        lastFrameAt = 0;
        smart = new boolean[s.hubs.size()][];
        halls.clear();
        adv = null;

        StringBuilder d = new StringBuilder();
        for (HubSpec.Hub h : s.hubs) {
            if (d.length() > 0) d.append(", ");
            d.append(h.isHall() ? "H" + h.ports + " " + h.addr : (h.adv >= Mk6Advertiser.MK4 ? "4.0 M" + (h.adv - 9) : "6.0 M" + (h.adv + 1)));
        }
        ConnLog.add("Link start: " + d);
        listener.onState("connecting");

        for (int i = 0; i < s.hubs.size(); i++) {
            HubSpec.Hub h = s.hubs.get(i);
            if (!h.isHall()) continue;
            final int pos = i;
            HallHub hh = new HallHub(context, h.addr, h.ports, new HallHub.Listener() {
                @Override
                public void onState(HallHub hub, int state, String msg) {
                    hallState(hub, state, msg);
                }

                @Override
                public void onSmartPorts(HallHub hub, boolean[] sm) {
                    smart[pos] = sm;
                }
            });
            halls.add(hh);
        }
        int[] am = s.advMods();
        if (am.length > 0) {
            adv = new Mk6Advertiser(adapter, this::advState);
            adv.start(am);
        } else {
            advDone = true;
        }
        if (silent) return;
        for (HallHub hh : halls) hh.connect();
        if (am.length == 0 && halls.isEmpty()) problem("error");
    }

    private int need() {
        return (spec.advMods().length > 0 ? 1 : 0) + halls.size();
    }

    private void checkReady() {
        if (!running || stopping || silent) return;
        int got = (advReady ? 1 : 0) + hallReady;
        if (got == need()) {
            ConnLog.add("All hubs ready");
            listener.onState("ready");
        }
    }

    private void advState(String st) {
        switch (st) {
            case "connecting":
                break;
            case "ready":
                advReady = true;
                checkReady();
                break;
            case "watchdog":
                listener.onState("watchdog");
                break;
            case "stopped":
                advDone = true;
                checkStopped();
                break;
            default:
                // off, denied, unsupported, error: the advertising link is gone
                advDone = true;
                problem(st);
        }
    }

    private void hallState(HallHub hub, int state, String msg) {
        if (state == HallHub.ACTIVE) {
            hallReady++;
            checkReady();
        } else if (state == HallHub.CLOSED) {
            hallDone++;
            if (msg != null && !stopping) problem("error");
            else checkStopped();
        }
    }

    /** A hub failed: tell the page once, then take everything down without a "stopped" event. */
    private void problem(String state) {
        if (silent || stopping) return;
        silent = true;
        listener.onState(state);
        teardown();
    }

    private void teardown() {
        if (adv != null && adv.isActive()) adv.stop();
        for (HallHub hh : halls) hh.close();
        if ((adv == null || !adv.isActive()) && hallDone >= halls.size()) finish();
    }

    private void finish() {
        running = false;
        stopping = false;
        adv = null;
        halls.clear();
    }

    void stop() {
        if (!running || stopping) return;
        stopping = true;
        ConnLog.add("Link stop requested");
        if (adv != null && adv.isActive()) adv.stop();
        else advDone = true;
        for (HallHub hh : halls) hh.close();
        checkStopped();
    }

    private void checkStopped() {
        if (!stopping && !silent) return;
        if (!advDone || hallDone < halls.size()) return;
        boolean tell = stopping && !silent;
        finish();
        if (tell) {
            ConnLog.add("Link stopped");
            listener.onState("stopped");
        }
    }

    void destroy() {
        if (adv != null) adv.destroy();
        for (HallHub hh : halls) hh.close();
        running = false;
        stopping = false;
    }

    /** Flat frame: hub i channel j at index i*6+j in the order of the hubs given to start(), -100..100. */
    void setFrame(int[] frame) {
        if (!running || spec == null || stopping) return;
        statFrames++;
        lastFrameAt = SystemClock.uptimeMillis();
        int n = spec.hubs.size();
        if (frame.length < n * 6) return;
        int[] advFrame = new int[spec.advMods().length * 6];
        int ai = 0, hi = 0;
        for (int i = 0; i < n; i++) {
            HubSpec.Hub h = spec.hubs.get(i);
            if (h.isHall()) {
                float[] v = new float[h.ports];
                for (int p = 0; p < h.ports; p++) v[p] = frame[i * 6 + p] / 100f;
                if (hi < halls.size()) halls.get(hi).update(v);
                hi++;
            } else {
                System.arraycopy(frame, i * 6, advFrame, ai * 6, 6);
                ai++;
            }
        }
        if (adv != null && advFrame.length > 0) adv.setFrame(advFrame);
    }

    /** Link diagnostics as JSON text for the Hub screen. */
    String stats() {
        try {
            JSONObject o = adv != null ? new JSONObject(adv.stats()) : new JSONObject();
            long now = SystemClock.uptimeMillis();
            int n = spec != null ? spec.hubs.size() : 0;
            if (halls.size() > 0 || adv == null) {
                if (adv == null) {
                    o.put("mode", !running ? "off" : n == 1 ? "single" : "parallel");
                    o.put("ok", 0).put("fail", 0).put("watchdog", 0).put("tx", JSONObject.NULL).put("err", 0).put("errAgo", -1);
                }
                long ok = o.optLong("ok", 0);
                for (HallHub hh : halls) ok += hh.sent();
                o.put("ok", ok);
                o.put("frames", statFrames);
                o.put("hubs", n);
                o.put("up", running ? now - statStartedAt : 0);
                o.put("lastFrameAgo", lastFrameAt > 0 ? now - lastFrameAt : -1);
                o.put("lat", 60);
                JSONArray advMods = o.optJSONArray("mods");
                JSONArray advAlive = o.optJSONArray("alive");
                JSONArray mods = new JSONArray(), alive = new JSONArray();
                int ai = 0, hi = 0;
                for (int i = 0; i < n; i++) {
                    HubSpec.Hub h = spec.hubs.get(i);
                    if (h.isHall()) {
                        mods.put(20 + i);
                        alive.put(hi < halls.size() && halls.get(hi).isLinked() ? 1 : 0);
                        hi++;
                    } else {
                        mods.put(advMods != null ? advMods.optInt(ai, h.adv) : h.adv);
                        alive.put(advAlive != null ? advAlive.optInt(ai, 0) : 0);
                        ai++;
                    }
                }
                o.put("mods", mods).put("alive", alive);
            }
            JSONArray sm = new JSONArray();
            if (smart != null) {
                for (boolean[] row : smart) {
                    JSONArray r = new JSONArray();
                    if (row != null) for (boolean b : row) r.put(b ? 1 : 0);
                    sm.put(r);
                }
            }
            o.put("smart", sm);
            return o.toString();
        } catch (JSONException e) {
            return "{}";
        }
    }
}
