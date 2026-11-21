package com.azimsupandi.mk6console;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.os.SystemClock;
import android.util.SparseArray;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lists nearby Bluetooth LE devices (name, signal, manufacturer data, services) so a hub can be
 * identified from inside the app. H4.0/H6.0 hubs show up with a name like YX-01 or YX-02; classic
 * 4.0/6.0 modules only listen and may not appear.
 */
final class BleInspector {
    private static final long AUTO_STOP_MS = 30000L;
    private static final int MAX_ROWS = 80;

    private static final class Row {
        String addr;
        String name;
        int rssi;
        int count;
        long seenAt;
        String mfr;
        String uuids;
    }

    private final BluetoothAdapter adapter;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Map<String, Row> rows = new LinkedHashMap<>();
    private BluetoothLeScanner scanner;
    private volatile boolean scanning;
    private int lastError;

    BleInspector(BluetoothAdapter adapter) {
        this.adapter = adapter;
    }

    private final Runnable autoStop = new Runnable() {
        @Override
        public void run() {
            stop();
        }
    };

    private final ScanCallback callback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult r) {
            record(r);
        }

        @Override
        public void onBatchScanResults(List<ScanResult> results) {
            for (ScanResult r : results) record(r);
        }

        @Override
        public void onScanFailed(int errorCode) {
            synchronized (rows) {
                lastError = errorCode;
                scanning = false;
            }
            ConnLog.add("Bluetooth scan failed: code " + errorCode);
        }
    };

    private void record(ScanResult r) {
        if (r == null || r.getDevice() == null) return;
        String addr = r.getDevice().getAddress();
        ScanRecord rec = r.getScanRecord();
        String name = rec != null ? rec.getDeviceName() : null;
        StringBuilder m = new StringBuilder();
        StringBuilder u = new StringBuilder();
        if (rec != null) {
            SparseArray<byte[]> md = rec.getManufacturerSpecificData();
            for (int i = 0; i < md.size(); i++) {
                if (m.length() > 0) m.append(" | ");
                m.append(String.format(java.util.Locale.US, "%04X: ", md.keyAt(i))).append(ConnLog.hex(md.valueAt(i)));
            }
            List<ParcelUuid> sv = rec.getServiceUuids();
            if (sv != null) {
                for (ParcelUuid p : sv) {
                    if (u.length() > 0) u.append(", ");
                    u.append(p.getUuid().toString());
                }
            }
        }
        synchronized (rows) {
            Row row = rows.get(addr);
            if (row == null) {
                if (rows.size() >= MAX_ROWS) return;
                row = new Row();
                row.addr = addr;
                rows.put(addr, row);
            }
            if (name != null && name.length() > 0) row.name = name;
            row.rssi = r.getRssi();
            row.count++;
            row.seenAt = SystemClock.uptimeMillis();
            row.mfr = m.toString();
            row.uuids = u.toString();
        }
    }

    /** @return true if the scan started */
    boolean start() {
        if (scanning) return true;
        if (adapter == null || !adapter.isEnabled()) {
            ConnLog.add("Scan: Bluetooth is off");
            return false;
        }
        scanner = adapter.getBluetoothLeScanner();
        if (scanner == null) return false;
        synchronized (rows) {
            rows.clear();
            lastError = 0;
        }
        try {
            ScanSettings s = new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build();
            scanner.startScan(null, s, callback);
            scanning = true;
            ConnLog.add("Scan started");
            handler.removeCallbacks(autoStop);
            handler.postDelayed(autoStop, AUTO_STOP_MS);
            return true;
        } catch (SecurityException e) {
            ConnLog.add("Scan: permission denied");
        } catch (RuntimeException e) {
            ConnLog.add("Scan could not start: " + e.getClass().getSimpleName());
        }
        return false;
    }

    void stop() {
        handler.removeCallbacks(autoStop);
        if (scanning && scanner != null) {
            try {
                scanner.stopScan(callback);
            } catch (RuntimeException ignored) {
            }
            ConnLog.add("Scan stopped");
        }
        scanning = false;
    }

    boolean isScanning() {
        return scanning;
    }

    /** JSON: {"scanning":bool,"err":n,"list":[{"a":"..","n":"..","r":-60,"c":12,"ago":300,"m":"..","u":".."}]} */
    String json() {
        List<Row> copy = new ArrayList<>();
        long now = SystemClock.uptimeMillis();
        int err;
        synchronized (rows) {
            copy.addAll(rows.values());
            err = lastError;
        }
        Collections.sort(copy, (a, b) -> b.rssi - a.rssi);
        StringBuilder b = new StringBuilder(copy.size() * 120 + 60);
        b.append("{\"scanning\":").append(scanning).append(",\"err\":").append(err).append(",\"list\":[");
        for (int i = 0; i < copy.size(); i++) {
            Row r = copy.get(i);
            if (i > 0) b.append(',');
            b.append("{\"a\":").append(q(r.addr)).append(",\"n\":").append(q(r.name == null ? "" : r.name))
                    .append(",\"r\":").append(r.rssi).append(",\"c\":").append(r.count)
                    .append(",\"ago\":").append(now - r.seenAt)
                    .append(",\"m\":").append(q(r.mfr)).append(",\"u\":").append(q(r.uuids)).append('}');
        }
        return b.append("]}").toString();
    }

    private static String q(String s) {
        StringBuilder b = new StringBuilder(s.length() + 2).append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\') b.append('\\').append(c);
            else if (c < 0x20) b.append(' ');
            else b.append(c);
        }
        return b.append('"').toString();
    }
}
