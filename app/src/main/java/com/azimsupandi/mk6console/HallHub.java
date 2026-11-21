package com.azimsupandi.mk6console;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.BluetoothStatusCodes;
import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;

import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;

/**
 * Bluetooth connection to one Mould King H4.0 / H6.0 hub (see {@link HallProtocol}).
 *
 * Steps: connect GATT, discover services, ask for a large MTU, switch on notifications, send the
 * connect message once a second until the hub answers (or four tries), then send speed messages
 * when values change and a heartbeat every second. Like the advertising link it has a safety
 * watchdog: if the page stops sending frames while something moves, every port is set to 0.
 */
@SuppressLint("MissingPermission")
final class HallHub {
    static final int CONNECTING = 0;
    static final int ACTIVE = 1;
    static final int CLOSED = 2;

    interface Listener {
        /** @param msg short reason when the state is CLOSED because of a problem, else null */
        void onState(HallHub hub, int state, String msg);

        /** Which ports have a smart motor, from a heartbeat reply. */
        void onSmartPorts(HallHub hub, boolean[] smart);
    }

    private static final UUID CCCD = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
    static final long WATCHDOG_MS = 500L;
    private static final long MIN_GAP_MS = 40L;

    final String address;
    final int ports;
    private final Context context;
    private final Listener listener;
    private final Handler main = new Handler(Looper.getMainLooper());

    private BluetoothGatt gatt;
    private BluetoothGattCharacteristic writeCh;
    private BluetoothGattCharacteristic notifyCh;
    private int mtu = 23;
    private boolean closed;
    private boolean linked;
    private boolean ready;
    private int connectTries;
    private boolean writing;
    private final ArrayDeque<byte[]> queue = new ArrayDeque<>();
    private final StringBuilder rx = new StringBuilder();

    private final float[] values;
    private String lastSpeedSent;
    private long lastSendAt;
    private long lastFrameAt;
    private boolean liveNonZero;
    private String lastHeartbeat;
    private long statSent;
    private boolean stallOn;
    // per port: servo mode (position target in ticks from a -1..1 value) and end stops (hub stops the port itself)
    private final double[][] servo = new double[6][];      // {loTicks, hiTicks, speedPct}
    private final int[][] ends = new int[6][];             // {hiTicks, loTicks}
    private final int[][] sentEnds = new int[6][];
    private final boolean[] servoSeen = new boolean[6];
    private final Integer[] targets = new Integer[6];
    private final int[] servoSpeeds = new int[6];
    private String lastAngleSent;

    HallHub(Context context, String address, int ports, Listener listener) {
        this.context = context;
        this.address = address;
        this.ports = ports;
        this.listener = listener;
        this.values = new float[ports];
    }

    boolean isLinked() { return linked && !closed; }
    long sent() { return statSent; }

    void setStallProtection(boolean on) {
        stallOn = on;
        if (linked && !closed) {
            enqueue(HallProtocol.stallProtection(on));
            ConnLog.add("H-hub " + address + ": stall protection " + (on ? "on" : "off"));
        }
    }

    /** Servo and end stop settings for the ports, from the page. Arrays have one entry per port, null = off. */
    void configure(double[][] servoCfg, int[][] endCfg) {
        for (int i = 0; i < 6; i++) {
            double[] sv = i < servoCfg.length ? servoCfg[i] : null;
            int[] en = i < endCfg.length ? endCfg[i] : null;
            if (i >= ports) { sv = null; en = null; }
            if (sv == null) servoSeen[i] = false;
            servo[i] = sv;
            ends[i] = en;
        }
        flush(false);
    }

    void connect() {
        BluetoothDevice dev = null;
        try {
            android.bluetooth.BluetoothManager bm = context.getSystemService(android.bluetooth.BluetoothManager.class);
            BluetoothAdapter ad = bm != null ? bm.getAdapter() : null;
            if (ad != null) dev = ad.getRemoteDevice(address);
        } catch (RuntimeException ignored) {
        }
        if (dev == null) {
            fail("Bad hub address " + address);
            return;
        }
        listener.onState(this, CONNECTING, null);
        ConnLog.add("H-hub " + address + ": connecting GATT");
        try {
            gatt = Build.VERSION.SDK_INT >= 23 ? dev.connectGatt(context, false, cb, BluetoothDevice.TRANSPORT_LE)
                    : dev.connectGatt(context, false, cb);
        } catch (SecurityException e) {
            fail("Bluetooth permission denied");
            return;
        }
        main.postDelayed(timeout, 20000L);
    }

    /** New values for every port, -1..1. Called often; only changes go on air. */
    void update(float[] v0) {
        float[] v = v0;
        lastFrameAt = SystemClock.uptimeMillis();
        boolean nz = false;
        for (int i = 0; i < ports; i++) {
            values[i] = i < v.length ? v[i] : 0f;
            if (values[i] != 0f) nz = true;
        }
        liveNonZero = nz;
        for (int i = 0; i < ports; i++) {
            double[] sv = servo[i];
            if (sv == null) { targets[i] = null; continue; }
            float v = i < v0.length ? v0[i] : 0f;
            // the first value only sets the starting point, so the servo does not jump when the link comes up
            if (!servoSeen[i]) { servoSeen[i] = true; if (v == 0f) { values[i] = 0f; continue; } }
            double f = (Math.max(-1f, Math.min(1f, v)) + 1.0) / 2.0;
            targets[i] = (int) Math.round(sv[0] + f * (sv[1] - sv[0]));
            servoSpeeds[i] = HallProtocol.servoSpeed((int) sv[2]);
            values[i] = 0f;
        }
        flush(false);
    }

    void close() {
        if (closed) return;
        closed = true;
        main.removeCallbacks(timeout);
        main.removeCallbacks(keepAlive);
        main.removeCallbacks(connectRetry);
        main.removeCallbacks(watchdog);
        if (ready && gatt != null) {
            // stop every motor and say goodbye before hanging up
            Arrays.fill(values, 0f);
            enqueue(HallProtocol.speed(values, null));
            enqueue(HallProtocol.disconnect());
            ConnLog.add("H-hub " + address + ": stopping");
            main.postDelayed(this::hangUp, 300L);
        } else {
            hangUp();
        }
    }

    private void hangUp() {
        main.removeCallbacksAndMessages(null);
        try {
            if (gatt != null) {
                gatt.disconnect();
                gatt.close();
            }
        } catch (RuntimeException ignored) {
        }
        gatt = null;
        ready = false;
        linked = false;
        listener.onState(this, CLOSED, null);
    }

    private void fail(String why) {
        ConnLog.add("H-hub " + address + ": " + why);
        if (closed) return;
        closed = true;
        main.removeCallbacksAndMessages(null);
        try {
            if (gatt != null) {
                gatt.disconnect();
                gatt.close();
            }
        } catch (RuntimeException ignored) {
        }
        gatt = null;
        ready = false;
        linked = false;
        listener.onState(this, CLOSED, why);
    }

    private final Runnable timeout = new Runnable() {
        @Override
        public void run() {
            if (!linked && !closed) fail("The hub did not answer. Switch it on, close the Mould King app and try again.");
        }
    };

    // ---------- sending ----------

    private void flush(boolean force) {
        if (!linked || closed) return;
        long now = SystemClock.uptimeMillis();
        if (!force && now - lastSendAt < MIN_GAP_MS) {
            main.removeCallbacks(pendingFlush);
            main.postDelayed(pendingFlush, MIN_GAP_MS);
            return;
        }
        // end points first, so the hub knows them before a limited port starts to move
        boolean[] limited = new boolean[ports];
        boolean endsSent = false;
        for (int i = 0; i < ports; i++) {
            int[] e = ends[i];
            limited[i] = e != null;
            if (e == null || java.util.Arrays.equals(e, sentEnds[i])) continue;
            String m = HallProtocol.endPoints(i, e[0], e[1]);
            enqueue(m);
            ConnLog.add("H-hub " + address + ": " + m + " (end stops, port " + (char) ('A' + i) + ")");
            sentEnds[i] = e.clone();
            endsSent = true;
        }
        String msg = HallProtocol.speed(values, limited);
        boolean hasServo = false;
        for (int i = 0; i < ports; i++) if (targets[i] != null) hasServo = true;
        String ang = hasServo ? HallProtocol.angle(java.util.Arrays.copyOf(targets, ports), java.util.Arrays.copyOf(servoSpeeds, ports)) : null;
        boolean speedChanged = !msg.equals(lastSpeedSent);
        boolean angleChanged = ang != null && !ang.equals(lastAngleSent);
        if (!force && !speedChanged && !angleChanged && !endsSent) return;
        lastSendAt = now;
        if (speedChanged || force) {
            lastSpeedSent = msg;
            enqueue(msg);
        }
        // the position message only when a target moves: repeating it after every speed message stops the other ports
        if (angleChanged) {
            lastAngleSent = ang;
            enqueue(ang);
        }
        statSent++;
    }

    private final Runnable pendingFlush = new Runnable() {
        @Override
        public void run() {
            flush(false);
        }
    };

    /** Heartbeat every second keeps the link up and repeats the speeds of running motors. */
    private final Runnable keepAlive = new Runnable() {
        @Override
        public void run() {
            if (closed || !linked) return;
            enqueue(HallProtocol.heartbeat());
            if (liveNonZero) flush(true);
            main.postDelayed(this, 1000L);
        }
    };

    private final Runnable watchdog = new Runnable() {
        @Override
        public void run() {
            if (closed) return;
            if (linked && liveNonZero && SystemClock.uptimeMillis() - lastFrameAt > WATCHDOG_MS) {
                Arrays.fill(values, 0f);
                liveNonZero = false;
                flush(true);
                ConnLog.add("H-hub " + address + ": safety stop, no frame for " + WATCHDOG_MS + " ms");
            }
            main.postDelayed(this, 100L);
        }
    };

    private void enqueue(String text) {
        byte[] bytes = text.getBytes(StandardCharsets.US_ASCII);
        int chunk = Math.max(20, mtu - 3);
        for (int i = 0; i < bytes.length; i += chunk) {
            queue.addLast(Arrays.copyOfRange(bytes, i, Math.min(bytes.length, i + chunk)));
        }
        main.post(this::pump);
    }

    private final Runnable writeWatchdog = new Runnable() {
        @Override
        public void run() {
            if (writing) {
                writing = false;
                pump();
            }
        }
    };

    private void pump() {
        if (writing || !ready || closed) return;
        byte[] v = queue.pollFirst();
        if (v == null) return;
        writing = true;
        if (!write(v)) writing = false;
        main.removeCallbacks(writeWatchdog);
        main.postDelayed(writeWatchdog, 300L);
    }

    @SuppressWarnings("deprecation")
    private boolean write(byte[] v) {
        BluetoothGatt g = gatt;
        BluetoothGattCharacteristic c = writeCh;
        if (g == null || c == null) return false;
        int type = (c.getProperties() & BluetoothGattCharacteristic.PROPERTY_WRITE) != 0
                ? BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT : BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE;
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                return g.writeCharacteristic(c, v, type) == BluetoothStatusCodes.SUCCESS;
            }
            c.setWriteType(type);
            c.setValue(v);
            return g.writeCharacteristic(c);
        } catch (RuntimeException e) {
            return false;
        }
    }

    // ---------- handshake ----------

    private final Runnable connectRetry = new Runnable() {
        @Override
        public void run() {
            if (closed || linked) return;
            connectTries++;
            enqueue(HallProtocol.connect());
            ConnLog.add("H-hub " + address + ": sent " + HallProtocol.connect() + " (try " + connectTries + ")");
            if (connectTries >= 4) {
                // some firmware never answers the connect message: carry on after four tries
                becomeLinked("no reply to connect, carrying on");
            } else {
                main.postDelayed(this, 1000L);
            }
        }
    };

    private void becomeLinked(String why) {
        if (linked || closed) return;
        linked = true;
        main.removeCallbacks(timeout);
        ConnLog.add("H-hub " + address + ": linked (" + why + "), " + ports + " ports");
        enqueue(HallProtocol.heartbeat());
        enqueue(HallProtocol.stallProtection(stallOn));
        ConnLog.add("H-hub " + address + ": stall protection " + (stallOn ? "on" : "off"));
        listener.onState(this, ACTIVE, null);
        lastSpeedSent = null;
        lastAngleSent = null;
        java.util.Arrays.fill(sentEnds, null);
        lastFrameAt = SystemClock.uptimeMillis();
        flush(true);
        main.postDelayed(keepAlive, 1000L);
        main.postDelayed(watchdog, 100L);
    }

    private void onReply(HallProtocol.Reply r) {
        if (r.cmd != 'C' || !r.data.equals(lastHeartbeat)) {
            ConnLog.add("H-hub " + address + ": reply T" + r.cmd + r.data + "W");
        }
        if (r.cmd == 'C') {
            lastHeartbeat = r.data;
            boolean[] smart = HallProtocol.smartPorts(r.data, ports);
            if (smart != null) listener.onSmartPorts(this, smart);
        }
        if (!linked) becomeLinked("hub replied");
    }

    private void received(byte[] v) {
        main.post(() -> {
            rx.append(new String(v, StandardCharsets.US_ASCII));
            for (HallProtocol.Reply r : HallProtocol.extract(rx)) onReply(r);
            if (rx.length() > 512) rx.setLength(0);
        });
    }

    // ---------- GATT callbacks ----------

    private void find(BluetoothGatt g) {
        BluetoothGattService svc = null;
        for (BluetoothGattService s : g.getServices()) {
            if (s.getUuid().toString().toLowerCase(Locale.US).contains(HallProtocol.SERVICE_TAG)) svc = s;
        }
        java.util.List<BluetoothGattCharacteristic> all = new java.util.ArrayList<>();
        if (svc != null) all.addAll(svc.getCharacteristics());
        else for (BluetoothGattService s : g.getServices()) all.addAll(s.getCharacteristics());
        for (BluetoothGattCharacteristic c : all) {
            String u = c.getUuid().toString().toLowerCase(Locale.US);
            if (writeCh == null && u.contains(HallProtocol.WRITE_TAG)) writeCh = c;
            if (notifyCh == null && u.contains(HallProtocol.NOTIFY_TAG)) notifyCh = c;
        }
    }

    @SuppressWarnings("deprecation")
    private void enableNotify(BluetoothGatt g) {
        BluetoothGattCharacteristic c = notifyCh;
        if (c == null) {
            startHandshake();
            return;
        }
        g.setCharacteristicNotification(c, true);
        BluetoothGattDescriptor d = c.getDescriptor(CCCD);
        if (d == null) {
            startHandshake();
            return;
        }
        boolean ok;
        if (Build.VERSION.SDK_INT >= 33) {
            ok = g.writeDescriptor(d, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE) == BluetoothStatusCodes.SUCCESS;
        } else {
            d.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
            ok = g.writeDescriptor(d);
        }
        if (!ok) startHandshake();
    }

    private void startHandshake() {
        if (ready || closed) return;
        ready = true;
        main.post(connectRetry);
    }

    private final BluetoothGattCallback cb = new BluetoothGattCallback() {
        @Override
        public void onConnectionStateChange(BluetoothGatt g, int status, int newState) {
            main.post(() -> {
                if (closed) return;
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    ConnLog.add("H-hub " + address + ": GATT connected");
                    main.postDelayed(g::discoverServices, 400L);
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    boolean was = linked;
                    fail(was ? "The hub disconnected" : "Could not connect (status " + status + "). Move closer and try again.");
                }
            });
        }

        @Override
        public void onServicesDiscovered(BluetoothGatt g, int status) {
            main.post(() -> {
                if (closed) return;
                find(g);
                if (writeCh == null) {
                    StringBuilder sv = new StringBuilder();
                    for (BluetoothGattService s : g.getServices()) sv.append(s.getUuid().toString().substring(0, 8)).append(' ');
                    fail("This is not an H4.0/H6.0 hub (no write channel). Services: " + sv.toString().trim());
                    return;
                }
                ConnLog.add("H-hub " + address + ": found write channel" + (notifyCh != null ? " and notify channel" : ""));
                if (!g.requestMtu(512)) enableNotify(g);
            });
        }

        @Override
        public void onMtuChanged(BluetoothGatt g, int newMtu, int status) {
            main.post(() -> {
                if (status == BluetoothGatt.GATT_SUCCESS) mtu = newMtu;
                ConnLog.add("H-hub " + address + ": MTU " + mtu);
                enableNotify(g);
            });
        }

        @Override
        public void onDescriptorWrite(BluetoothGatt g, BluetoothGattDescriptor d, int status) {
            main.post(HallHub.this::startHandshake);
        }

        @Override
        public void onCharacteristicWrite(BluetoothGatt g, BluetoothGattCharacteristic c, int status) {
            main.post(() -> {
                writing = false;
                main.removeCallbacks(writeWatchdog);
                pump();
            });
        }

        @Override
        @SuppressWarnings("deprecation")
        public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c) {
            if (Build.VERSION.SDK_INT < 33 && c.getValue() != null) received(c.getValue());
        }

        @Override
        public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c, byte[] value) {
            received(value);
        }
    };
}
