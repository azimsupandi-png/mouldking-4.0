package com.azimsupandi.mk6console;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertisingSet;
import android.bluetooth.le.AdvertisingSetCallback;
import android.bluetooth.le.AdvertisingSetParameters;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;

import java.util.Arrays;

/**
 * Drives up to three Mould King hubs over BLE advertising: 6.0 hubs and 4.0 hubs, mixed if needed.
 *
 * Hub slots are given as module numbers: 0..2 for a 6.0 hub (module 1..3), 10..12 for a 4.0 hub.
 * A 4.0 hub has 4 ports (A-D) with 7 speed steps each way, and all 4.0 modules share one
 * telegram (one nibble per port), so every 4.0 slot always sends the same combined telegram.
 *
 * Hub 0 uses the primary advertising set. Extra hubs either get their own
 * advertising set ("parallel" mode) or, if the phone cannot run several sets,
 * the primary set rotates through hubs every {@link #ROTATE_MS}.
 *
 * States reported to the listener: connecting, ready, stopped, off, denied,
 * unsupported, error, watchdog.
 *
 * Safety watchdog: while a hub is driven, the page sends a frame at least every
 * 150-250 ms whenever any output is non-zero. If no frame arrives for
 * {@link #WATCHDOG_MS} while the last frame was non-zero (page frozen or busy),
 * every channel is set to neutral and "watchdog" is reported once.
 */
final class Mk6Advertiser {

    interface Listener {
        void onState(String state);
    }

    private static final byte[] ADDR = {(byte) 0xC1, (byte) 0xC2, (byte) 0xC3, (byte) 0xC4, (byte) 0xC5};
    private static final byte[] CONNECT = {0x6D, 0x7B, (byte) 0xA7, (byte) 0x80, (byte) 0x80, (byte) 0x80, (byte) 0x80, (byte) 0x92};
    /** Mould King 4.0 connect telegram (same app id bytes as the 6.0 one). */
    private static final byte[] CONNECT4 = {(byte) 0xAD, 0x7B, (byte) 0xA7, (byte) 0x80, (byte) 0x80, (byte) 0x80, 0x4F, 0x52};
    /** Slot numbers from this value up are Mould King 4.0 modules (10 = module 1). */
    static final int MK4 = 10;
    private static final long CONNECT_FLIP_MS = 150L;
    private static final int CHANNELS = 6;
    private static final int COMPANY_ID = 0xFFF0;
    private static final long CONNECT_MS = 3000L;
    private static final int CTX = 37;
    private static final int MAX_HUBS = 3;
    private static final long MIN_GAP_MS = 60L;
    private static final long NEUTRAL_BEFORE_STOP_MS = 250L;
    private static final long ROTATE_MS = 100L;
    private static final int MAX_FAILS = 40;
    static final long WATCHDOG_MS = 500L;
    private static final long WATCHDOG_CHECK_MS = 100L;

    private final BluetoothAdapter adapter;
    private final Listener listener;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private BluetoothLeAdvertiser advertiser;
    private AdvertisingSet set;
    private final AdvertisingSet[] extra = new AdvertisingSet[MAX_HUBS];
    private final SetCb[] extraCb = new SetCb[MAX_HUBS];

    private boolean running;
    private boolean starting;
    private boolean stopping;
    private boolean connecting;
    private boolean parallel;
    private boolean pushScheduled;
    private boolean extrasFailed;
    private int extrasPending;
    private int failCount;
    private int rotateIdx;
    private long lastPushAt;
    private long lastFrameAt;
    private boolean liveNonZero;

    // ---- diagnostics (read by the app's Hub screen) ----
    private long statOk;
    private long statFail;
    private long statFrames;
    private long statStartedAt;
    private long statWatchdog;
    private int statTxPower = Integer.MIN_VALUE;
    private int statLastError;
    private long statLastErrorAt;

    private void noteFail(int status) {
        statFail++;
        statLastError = status;
        statLastErrorAt = SystemClock.uptimeMillis();
    }

    private int[] modules = {0};
    private boolean connectFlip;

    private boolean isMk4(int slot) {
        return modules[slot] >= MK4;
    }

    private boolean anyMk4() {
        for (int m : modules) if (m >= MK4) return true;
        return false;
    }

    private boolean allMk4() {
        for (int m : modules) if (m < MK4) return false;
        return true;
    }

    /** Mixed 6.0 and 4.0 hubs: alternate the two connect telegrams during the connect window. */
    private final Runnable connectFlipTask = new Runnable() {
        @Override
        public void run() {
            if (!running || !connecting || set == null) return;
            connectFlip = !connectFlip;
            try {
                set.setAdvertisingData(dataFor(connectFlip ? CONNECT4 : CONNECT));
            } catch (RuntimeException ignored) {
            }
            handler.postDelayed(this, CONNECT_FLIP_MS);
        }
    };
    private int[][] latest = new int[1][CHANNELS];
    private final int[] sent = new int[MAX_HUBS * CHANNELS];

    /** Primary advertising set callback. */
    private final AdvertisingSetCallback callback = new AdvertisingSetCallback() {
        @Override
        public void onAdvertisingSetStarted(AdvertisingSet advertisingSet, int txPower, int status) {
            handler.post(() -> {
                starting = false;
                if (status == ADVERTISE_SUCCESS) {
                    statTxPower = txPower;
                    statStartedAt = SystemClock.uptimeMillis();
                } else {
                    noteFail(status);
                }
                if (status == ADVERTISE_SUCCESS && !stopping) {
                    set = advertisingSet;
                    running = true;
                    connecting = true;
                    listener.onState("connecting");
                    handler.postDelayed(finishConnect, CONNECT_MS);
                    if (anyMk4() && !allMk4()) {
                        connectFlip = false;
                        handler.postDelayed(connectFlipTask, CONNECT_FLIP_MS);
                    }
                } else if (status == ADVERTISE_SUCCESS) {
                    // stop() was requested while starting
                    set = advertisingSet;
                    running = true;
                    stopNow();
                } else {
                    running = false;
                    listener.onState("error");
                }
            });
        }

        @Override
        public void onAdvertisingDataSet(AdvertisingSet advertisingSet, int status) {
            handler.post(() -> {
                if (status == ADVERTISE_SUCCESS) {
                    statOk++;
                    failCount = 0;
                    return;
                }
                noteFail(status);
                if (!running || connecting || stopping) return;
                failCount++;
                if (failCount > MAX_FAILS) {
                    stopNow();
                    listener.onState("error");
                } else if (modules.length == 1 || parallel) {
                    schedulePush();
                }
            });
        }

        @Override
        public void onAdvertisingSetStopped(AdvertisingSet advertisingSet) {
            handler.post(() -> {
                set = null;
                running = false;
                starting = false;
            });
        }
    };

    /** End of the CONNECT handshake window: start extra hubs and push real data. */
    private final Runnable finishConnect = new Runnable() {
        @Override
        public void run() {
            if (!running) return;
            connecting = false;
            handler.removeCallbacks(connectFlipTask);
            if (modules.length > 1) startExtras();
            pushDirty(true);
            lastFrameAt = SystemClock.uptimeMillis();
            handler.removeCallbacks(watchdog);
            handler.postDelayed(watchdog, WATCHDOG_CHECK_MS);
            listener.onState("ready");
        }
    };

    /** Fallback when only one advertising set is available: cycle hubs. */
    private final Runnable rotateTask = new Runnable() {
        @Override
        public void run() {
            if (!running || connecting) return;
            if (rotateIdx >= modules.length) rotateIdx = 0;
            pushModule(rotateIdx);
            rotateIdx = (rotateIdx + 1) % modules.length;
            handler.postDelayed(this, ROTATE_MS);
        }
    };

    private final Runnable pushTask = new Runnable() {
        @Override
        public void run() {
            pushScheduled = false;
            if (parallel || modules.length == 1) pushDirty(false);
        }
    };

    /** Sets every channel to neutral if the page stops sending while something moves. */
    private final Runnable watchdog = new Runnable() {
        @Override
        public void run() {
            if (!running || stopping) return;
            if (!connecting && set != null && liveNonZero
                    && SystemClock.uptimeMillis() - lastFrameAt > WATCHDOG_MS) {
                for (int i = 0; i < modules.length; i++) Arrays.fill(latest[i], 0);
                liveNonZero = false;
                if (parallel || modules.length == 1) pushDirty(true);
                statWatchdog++;
                listener.onState("watchdog");
            }
            handler.postDelayed(this, WATCHDOG_CHECK_MS);
        }
    };

    private final Runnable stopTask = new Runnable() {
        @Override
        public void run() {
            stopNow();
        }
    };

    /** Callback for the additional (hub 1, hub 2) advertising sets. */
    private final class SetCb extends AdvertisingSetCallback {
        final int idx;

        SetCb(int idx) {
            this.idx = idx;
        }

        @Override
        public void onAdvertisingSetStarted(AdvertisingSet advertisingSet, int txPower, int status) {
            handler.post(() -> onExtraStarted(idx, advertisingSet, status));
        }

        @Override
        public void onAdvertisingDataSet(AdvertisingSet advertisingSet, int status) {
            handler.post(() -> {
                if (status == ADVERTISE_SUCCESS) {
                    statOk++;
                    return;
                }
                noteFail(status);
                if (parallel && running && !connecting && !stopping) schedulePush();
            });
        }

        @Override
        public void onAdvertisingSetStopped(AdvertisingSet advertisingSet) {
            handler.post(() -> {
                if (extra[idx] == advertisingSet) extra[idx] = null;
            });
        }
    }

    Mk6Advertiser(BluetoothAdapter adapter, Listener listener) {
        this.adapter = adapter;
        this.listener = listener;
    }

    /** Maps -100..100 to the hub's 0..255 byte, 128 = neutral (±1 dead zone). */
    static int channelByte(float v) {
        if (v >= -1f && v <= 1f) return 128;
        float mag = Math.min(Math.abs(v), 100f) * 128f / 100f;
        mag = Math.min(128f, mag);
        if (v < 0f) return (int) Math.max(0f, 128f - mag);
        return (int) Math.min(255f, 128f + mag);
    }

    /** Maps -100..100 to a Mould King 4.0 nibble: 8 = stop, 9..15 forward steps 1..7, 1..7 reverse steps 1..7. */
    static int nibble4(float v) {
        float f = Math.max(-1f, Math.min(1f, v / 100f));
        if (f <= -1f / 7f) return Math.min(7, (int) (-f * 7f));
        if (f >= 1f / 7f) return Math.min(15, (int) (f * 7f + 8f));
        return 8;
    }

    /**
     * Mould King 4.0 telegram for every 4.0 slot: 7D, app id, 6 bytes of nibbles, 82.
     * Module m, port p (0..3) sits in byte 3 + 2m + p/2: ports A and C in the high nibble, B and D in the low one.
     */
    static byte[] telegram4(int[] mods, int[][] values) {
        byte[] t = {0x7D, 0x7B, (byte) 0xA7, (byte) 0x88, (byte) 0x88, (byte) 0x88, (byte) 0x88, (byte) 0x88, (byte) 0x88, (byte) 0x82};
        for (int k = 0; k < mods.length; k++) {
            if (mods[k] < MK4) continue;
            int m = mods[k] - MK4;
            for (int p = 0; p < 4; p++) {
                int pos = 3 + m * 2 + (p >> 1);
                int n = nibble4(values[k][p]);
                int b = t[pos] & 0xFF;
                b = (p & 1) == 1 ? (b & 0xF0) | n : (b & 0x0F) | (n << 4);
                t[pos] = (byte) b;
            }
        }
        return t;
    }

    private byte[] telegramFor(int slot) {
        return isMk4(slot) ? telegram4(modules, latest) : telegram(modules[slot], latest[slot]);
    }

    static byte[] telegram(int module, int[] channels) {
        byte[] t = new byte[10];
        t[0] = (byte) (module + 0x61);
        t[1] = 0x7B;
        t[2] = (byte) 0xA7;
        for (int i = 0; i < CHANNELS; i++) {
            t[3 + i] = (byte) channelByte(channels[i]);
        }
        t[9] = (byte) (0x9E - module);
        return t;
    }

    private static AdvertiseData dataFor(byte[] telegram) {
        byte[] payload = Mk6Crypt.rfPayload(ADDR, telegram, CTX);
        return new AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)
                .addManufacturerData(COMPANY_ID, payload)
                .build();
    }

    private static AdvertisingSetParameters params() {
        return new AdvertisingSetParameters.Builder()
                .setLegacyMode(true)
                .setConnectable(true)
                .setScannable(true)
                .setInterval(AdvertisingSetParameters.INTERVAL_LOW)
                .setTxPowerLevel(AdvertisingSetParameters.TX_POWER_HIGH)
                .build();
    }

    /** Link diagnostics as JSON text for the app's Hub screen. */
    String stats() {
        long now = SystemClock.uptimeMillis();
        String mode = !running ? "off" : connecting ? "connecting"
                : modules.length == 1 ? "single" : parallel ? "parallel" : "rotate";
        StringBuilder b = new StringBuilder(200);
        b.append("{\"mode\":\"").append(mode).append('"')
                .append(",\"hubs\":").append(modules.length)
                .append(",\"ok\":").append(statOk)
                .append(",\"fail\":").append(statFail)
                .append(",\"frames\":").append(statFrames)
                .append(",\"watchdog\":").append(statWatchdog)
                .append(",\"up\":").append(running && statStartedAt > 0 ? (now - statStartedAt) : 0)
                .append(",\"lastFrameAgo\":").append(lastFrameAt > 0 ? (now - lastFrameAt) : -1)
                .append(",\"tx\":").append(statTxPower == Integer.MIN_VALUE ? "null" : String.valueOf(statTxPower))
                .append(",\"err\":").append(statLastError)
                .append(",\"errAgo\":").append(statLastErrorAt > 0 ? (now - statLastErrorAt) : -1);
        // Per hub: module number and whether its radio set is on air right now
        b.append(",\"mods\":[");
        for (int i = 0; i < modules.length; i++) { if (i > 0) b.append(','); b.append(modules[i]); }
        b.append("],\"alive\":[");
        for (int i = 0; i < modules.length; i++) {
            if (i > 0) b.append(',');
            boolean on = running && !connecting && set != null
                    && (i == 0 || !parallel || extra[i] != null);
            b.append(on ? 1 : 0);
        }
        long lat = !running ? 0 : (modules.length > 1 && !parallel) ? modules.length * ROTATE_MS : MIN_GAP_MS;
        b.append("],\"lat\":").append(lat).append('}');
        return b.toString();
    }

    boolean isActive() {
        return running || starting;
    }

    /** @param mods hub module indices (0..2), unique, 1..3 entries */
    void start(int[] mods) {
        if (running || starting) return;
        if (mods == null || mods.length < 1 || mods.length > MAX_HUBS) {
            listener.onState("error");
            return;
        }
        for (int i = 0; i < mods.length; i++) {
            if ((mods[i] < 0 || mods[i] > 2) && (mods[i] < MK4 || mods[i] > MK4 + 2)) {
                listener.onState("error");
                return;
            }
            for (int j = 0; j < i; j++) {
                if (mods[i] == mods[j]) {
                    listener.onState("error");
                    return;
                }
            }
        }
        if (adapter == null) {
            listener.onState("unsupported");
            return;
        }
        if (!adapter.isEnabled()) {
            listener.onState("off");
            return;
        }
        advertiser = adapter.getBluetoothLeAdvertiser();
        if (advertiser == null) {
            listener.onState("unsupported");
            return;
        }
        modules = mods.clone();
        latest = new int[modules.length][CHANNELS];
        rotateIdx = 0;
        parallel = false;
        extrasPending = 0;
        extrasFailed = false;
        Arrays.fill(sent, Integer.MIN_VALUE);
        failCount = 0;
        stopping = false;
        starting = true;
        try {
            advertiser.startAdvertisingSet(params(), dataFor(allMk4() ? CONNECT4 : CONNECT), null, null, null, callback);
        } catch (SecurityException e) {
            starting = false;
            listener.onState("denied");
        } catch (RuntimeException e) {
            starting = false;
            listener.onState("error");
        }
    }

    /** Flat frame: hub i channel j at index i*6+j, values -100..100. */
    void setFrame(int[] frame) {
        statFrames++;
        lastFrameAt = SystemClock.uptimeMillis();
        boolean nz = false;
        for (int v : frame) {
            if (v != 0) {
                nz = true;
                break;
            }
        }
        liveNonZero = nz;
        for (int i = 0; i < modules.length; i++) {
            for (int j = 0; j < CHANNELS; j++) {
                int k = i * CHANNELS + j;
                latest[i][j] = k < frame.length ? frame[k] : 0;
            }
        }
        if (running && !connecting && set != null && (parallel || modules.length == 1)) {
            schedulePush();
        }
    }

    /** Graceful stop: send neutral to every hub first, then tear down. */
    void stop() {
        if (!running && !starting) return;
        stopping = true;
        handler.removeCallbacks(finishConnect);
        handler.removeCallbacks(connectFlipTask);
        handler.removeCallbacks(pushTask);
        pushScheduled = false;
        handler.removeCallbacks(watchdog);
        liveNonZero = false;
        if (running && set != null) {
            for (int i = 0; i < modules.length; i++) {
                Arrays.fill(latest[i], 0);
            }
            connecting = false;
            long delay;
            if (!parallel && modules.length != 1) {
                handler.removeCallbacks(rotateTask);
                handler.post(rotateTask);
                delay = modules.length * 200L + 150L;
            } else {
                pushDirty(true);
                delay = NEUTRAL_BEFORE_STOP_MS;
            }
            handler.postDelayed(stopTask, delay);
        } else if (!starting) {
            stopNow();
        }
    }

    void destroy() {
        handler.removeCallbacksAndMessages(null);
        stopNow();
    }

    private void schedulePush() {
        if (pushScheduled) return;
        long wait = Math.max(0L, lastPushAt + MIN_GAP_MS - SystemClock.uptimeMillis());
        pushScheduled = true;
        handler.postDelayed(pushTask, wait);
    }

    /** Push every hub whose channels changed since last send (or all, if forced). */
    private void pushDirty(boolean force) {
        if (!running || set == null || connecting) return;
        try {
            boolean[] dirtyAt = new boolean[modules.length];
            boolean mk4Dirty = false;
            for (int i = 0; i < modules.length; i++) {
                boolean dirty = force;
                for (int j = 0; j < CHANNELS && !dirty; j++) {
                    if (sent[i * CHANNELS + j] != latest[i][j]) dirty = true;
                }
                dirtyAt[i] = dirty;
                if (dirty && isMk4(i)) mk4Dirty = true;
            }
            for (int i = 0; i < modules.length; i++) {
                // 4.0 hubs share one telegram: a change on one 4.0 hub is sent by every 4.0 slot
                if (!dirtyAt[i] && !(mk4Dirty && isMk4(i))) continue;
                AdvertisingSet target = i == 0 ? set : extra[i];
                if (target == null) continue;
                target.setAdvertisingData(dataFor(telegramFor(i)));
                for (int j = 0; j < CHANNELS; j++) {
                    sent[i * CHANNELS + j] = latest[i][j];
                }
            }
            lastPushAt = SystemClock.uptimeMillis();
        } catch (RuntimeException e) {
            stopNow();
            listener.onState("error");
        }
    }

    private void pushModule(int i) {
        if (!running || set == null || i >= modules.length) return;
        try {
            set.setAdvertisingData(dataFor(telegramFor(i)));
            lastPushAt = SystemClock.uptimeMillis();
        } catch (RuntimeException e) {
            stopNow();
            listener.onState("error");
        }
    }

    private void startExtras() {
        extrasPending = 0;
        extrasFailed = false;
        AdvertisingSetParameters p = params();
        for (int i = 1; i < modules.length; i++) {
            extraCb[i] = new SetCb(i);
            extrasPending++;
            try {
                advertiser.startAdvertisingSet(p, dataFor(telegramFor(i)),
                        null, null, null, extraCb[i]);
            } catch (RuntimeException e) {
                extrasPending--;
                extrasFailed = true;
            }
        }
        if (extrasPending == 0 && extrasFailed) fallBackToRotate();
    }

    private void onExtraStarted(int idx, AdvertisingSet s, int status) {
        extrasPending--;
        if (status != AdvertisingSetCallback.ADVERTISE_SUCCESS) {
            extrasFailed = true;
        } else {
            extra[idx] = s;
            if (!running || stopping) {
                try {
                    if (extraCb[idx] != null) advertiser.stopAdvertisingSet(extraCb[idx]);
                } catch (RuntimeException ignored) {
                }
                extra[idx] = null;
            }
        }
        if (extrasPending > 0 || !running || stopping) return;
        if (extrasFailed) {
            fallBackToRotate();
            return;
        }
        parallel = true;
        pushDirty(true);
    }

    private void fallBackToRotate() {
        stopExtras();
        parallel = false;
        handler.removeCallbacks(rotateTask);
        handler.post(rotateTask);
    }

    private void stopExtras() {
        for (int i = 1; i < MAX_HUBS; i++) {
            if (extraCb[i] != null) {
                try {
                    advertiser.stopAdvertisingSet(extraCb[i]);
                } catch (RuntimeException ignored) {
                }
            }
            extra[i] = null;
        }
    }

    private void stopNow() {
        handler.removeCallbacks(watchdog);
        liveNonZero = false;
        handler.removeCallbacks(stopTask);
        handler.removeCallbacks(finishConnect);
        handler.removeCallbacks(connectFlipTask);
        handler.removeCallbacks(pushTask);
        handler.removeCallbacks(rotateTask);
        pushScheduled = false;
        connecting = false;
        parallel = false;
        stopExtras();
        try {
            if (advertiser != null && (running || starting)) {
                advertiser.stopAdvertisingSet(callback);
            }
        } catch (RuntimeException ignored) {
        }
        set = null;
        running = false;
        starting = false;
        stopping = false;
        listener.onState("stopped");
    }
}
