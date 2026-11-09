package com.azimsupandi.mk6console;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.drawable.Icon;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Hosts the MK6 Console web UI (assets/index.html) in a WebView and exposes
 * native features to it through the {@code MK6Bridge} JavaScript interface.
 *
 * JS -> native: MK6Bridge.start/send/stop/haptic/tilt/immersive/battery/btOn/
 *               btSettings/exportFile/importFile/pickWallpaper/autoBackup/
 *               pinModel/shortcuts
 * native -> JS: window.onHubState, onAppEvent, onTilt, onFileResult,
 *               onImportText, onWallpaper, openModel
 */
public class MainActivity extends Activity {

    private static final String PAGE = "file:///android_asset/index.html";
    private static final String ASSET_PREFIX = "file:///android_asset/";
    private static final String MODEL_ID = "[A-Za-z0-9_-]{1,40}";
    private static final String BACKUP_NAME = "MK6-Console-backup.json";
    private static final int MAX_IMPORT_BYTES = 1024 * 1024;
    private static final int MAX_WALLPAPER_PX = 1600;
    private static final long TILT_MIN_MS = 30L;

    private static final int REQ_BLUETOOTH = 41;
    private static final int REQ_EXPORT = 42;
    private static final int REQ_IMPORT = 43;
    private static final int REQ_WALL = 44;

    private WebView web;
    private Mk6Advertiser mk6;
    private Vibrator vibrator;
    private SensorManager sm;

    private boolean pageReady;
    private boolean fullScreen = true;
    private boolean tiltOn;
    private long lastTilt;
    private boolean btReceiverOn;

    private int[] pendingMods;
    private String pendingModel;
    private String pendingExport;
    private String pendingWall;

    private final BroadcastReceiver btReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (!BluetoothAdapter.ACTION_STATE_CHANGED.equals(intent.getAction())) return;
            int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, Integer.MIN_VALUE);
            if (state == BluetoothAdapter.STATE_ON) notifyApp("bt1");
            boolean goingOff = state == BluetoothAdapter.STATE_OFF || state == BluetoothAdapter.STATE_TURNING_OFF;
            if (goingOff) {
                notifyApp("bt0");
                boolean wasActive = mk6.isActive();
                mk6.destroy();
                if (wasActive) notifyApp("btoff");
            }
        }
    };

    private final SensorEventListener tiltL = new SensorEventListener() {
        @Override
        public void onSensorChanged(SensorEvent event) {
            long now = SystemClock.uptimeMillis();
            if (now - lastTilt < TILT_MIN_MS) return;
            lastTilt = now;
            int rotation;
            try {
                rotation = getWindowManager().getDefaultDisplay().getRotation() * 90;
            } catch (RuntimeException e) {
                rotation = 0;
            }
            String js = String.format(Locale.US, "window.onTilt&&window.onTilt(%.2f,%.2f,%d)",
                    event.values[0], event.values[1], rotation);
            web.evaluateJavascript(js, null);
        }

        @Override
        public void onAccuracyChanged(Sensor sensor, int accuracy) {
        }
    };

    // ---------------------------------------------------------------- lifecycle

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            try {
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= 30
                        ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                        : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                getWindow().setAttributes(lp);
            } catch (RuntimeException ignored) {
            }
        }

        BluetoothManager bm = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
        BluetoothAdapter adapter = bm != null ? bm.getAdapter() : null;
        mk6 = new Mk6Advertiser(adapter, state -> {
            // The safety watchdog is an app event, not a link state: the hub stays connected.
            if ("watchdog".equals(state)) notifyApp("watchdog");
            else notifyPage(state);
        });

        try {
            registerReceiver(btReceiver, new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED));
            btReceiverOn = true;
        } catch (RuntimeException e) {
            btReceiverOn = false;
        }

        web = new WebView(this);
        setContentView(web);
        web.setHapticFeedbackEnabled(false);
        web.setLongClickable(false);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        readModelExtra(getIntent());

        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                deliverModel();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Keep navigation inside the bundled app.
                return !request.getUrl().toString().startsWith(ASSET_PREFIX);
            }
        });
        web.addJavascriptInterface(new Bridge(), "MK6Bridge");
        web.loadUrl(PAGE);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        readModelExtra(intent);
        deliverModel();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            web.onResume();
            web.resumeTimers();
        }
        notifyApp("resume");
        if (!mk6.isActive() && pendingMods == null) notifyPage("stopped");
    }

    @Override
    protected void onPause() {
        // Safety: never keep driving a model while the app is in the background.
        mk6.stop();
        setTilt(false);
        // Battery: no page timers or rendering while the app is in the background.
        if (web != null) {
            web.onPause();
            web.pauseTimers();
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (btReceiverOn) {
            try {
                unregisterReceiver(btReceiver);
            } catch (RuntimeException ignored) {
            }
            btReceiverOn = false;
        }
        setTilt(false);
        mk6.destroy();
        super.onDestroy();
    }

    /** Back goes up one screen inside the app; it only leaves the app from Home. */
    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web == null || !pageReady) {
            super.onBackPressed();
            return;
        }
        web.evaluateJavascript("(window.mk6Back&&window.mk6Back())?1:0", result -> {
            if (!"1".equals(result)) super.onBackPressed();
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyFull();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_BLUETOOTH) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED && pendingMods != null) {
            mk6.start(pendingMods);
        } else {
            notifyPage("denied");
        }
        pendingMods = null;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQ_WALL) {
            String slot = pendingWall;
            pendingWall = null;
            if (slot != null && resultCode == RESULT_OK && data != null && data.getData() != null) {
                Uri uri = data.getData();
                new Thread(() -> notifyWall(slot, loadWallpaper(uri))).start();
                return;
            }
            notifyWall(slot != null ? slot : "p", null);
            return;
        }

        if (requestCode != REQ_EXPORT && requestCode != REQ_IMPORT) return;
        String kind = requestCode == REQ_EXPORT ? "export" : "import";
        if (resultCode != RESULT_OK || data == null || data.getData() == null) {
            pendingExport = null;
            notifyFile(kind, "cancel");
            return;
        }
        Uri uri = data.getData();
        try {
            if (requestCode == REQ_EXPORT) {
                String text = pendingExport != null ? pendingExport : "";
                pendingExport = null;
                try (OutputStream os = getContentResolver().openOutputStream(uri, "wt")) {
                    if (os == null) throw new IOException("no stream");
                    os.write(text.getBytes(StandardCharsets.UTF_8));
                }
                notifyFile("export", "ok");
            } else {
                String text = readLimited(uri);
                if (text == null) {
                    notifyFile("import", "fail");
                    return;
                }
                String js = "window.onImportText&&window.onImportText(" + JSONObject.quote(text) + ")";
                web.post(() -> web.evaluateJavascript(js, null));
            }
        } catch (Exception e) {
            notifyFile(kind, "fail");
        }
    }

    // ---------------------------------------------------------------- helpers

    private void applyFull() {
        int flags = fullScreen
                ? View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                : 0;
        try {
            getWindow().getDecorView().setSystemUiVisibility(flags);
        } catch (RuntimeException ignored) {
        }
    }

    private void buzz(long[] pattern) {
        if (vibrator == null || !vibrator.hasVibrator()) return;
        try {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
        } catch (RuntimeException ignored) {
        }
    }

    private void requestStart(int[] mods) {
        if (Build.VERSION.SDK_INT >= 31
                && checkSelfPermission(Manifest.permission.BLUETOOTH_ADVERTISE) != PackageManager.PERMISSION_GRANTED) {
            pendingMods = mods;
            requestPermissions(new String[]{Manifest.permission.BLUETOOTH_ADVERTISE}, REQ_BLUETOOTH);
            return;
        }
        mk6.start(mods);
    }

    private void setTilt(boolean on) {
        if (on == tiltOn) return;
        if (sm == null) sm = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) {
            if (on) notifyApp("notilt");
            return;
        }
        if (on) {
            Sensor accel = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            if (accel == null) {
                notifyApp("notilt");
                return;
            }
            sm.registerListener(tiltL, accel, SensorManager.SENSOR_DELAY_GAME);
            tiltOn = true;
        } else {
            sm.unregisterListener(tiltL);
            tiltOn = false;
        }
    }

    /** "a,b,c" -> hub module indices (1..3 entries). */
    private static int[] parseMods(String s) {
        if (s == null) return null;
        String[] parts = s.split(",");
        if (parts.length < 1 || parts.length > 3) return null;
        int[] out = new int[parts.length];
        try {
            for (int i = 0; i < parts.length; i++) {
                out[i] = Integer.parseInt(parts[i].trim());
            }
            return out;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** 6, 12 or 18 comma separated channel values, clamped to -100..100. */
    private static int[] parseFrame(String s) {
        if (s == null) return null;
        String[] parts = s.split(",");
        if (parts.length != 6 && parts.length != 12 && parts.length != 18) return null;
        int[] out = new int[parts.length];
        try {
            for (int i = 0; i < parts.length; i++) {
                out[i] = Math.max(-100, Math.min(100, Integer.parseInt(parts[i].trim())));
            }
            return out;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String readLimited(Uri uri) throws IOException {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) return null;
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) {
                bos.write(buf, 0, n);
                if (bos.size() > MAX_IMPORT_BYTES) return null;
            }
            return new String(bos.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    /** Decode, downscale (max 1600 px), apply EXIF rotation, return a JPEG data URL. */
    private String loadWallpaper(Uri uri) {
        try {
            ContentResolver cr = getContentResolver();
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inJustDecodeBounds = true;
            try (InputStream in = cr.openInputStream(uri)) {
                if (in == null) return null;
                BitmapFactory.decodeStream(in, null, opts);
            }
            if (opts.outWidth <= 0 || opts.outHeight <= 0) return null;

            int sample = 1;
            while (Math.max(opts.outWidth, opts.outHeight) / (sample * 2) >= MAX_WALLPAPER_PX) {
                sample *= 2;
            }
            opts.inJustDecodeBounds = false;
            opts.inSampleSize = sample;

            Bitmap bmp;
            try (InputStream in = cr.openInputStream(uri)) {
                if (in == null) return null;
                bmp = BitmapFactory.decodeStream(in, null, opts);
            }
            if (bmp == null) return null;

            int rotation = 0;
            try (InputStream in = cr.openInputStream(uri)) {
                if (in != null) {
                    int o = new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION, 1);
                    if (o == ExifInterface.ORIENTATION_ROTATE_90) rotation = 90;
                    else if (o == ExifInterface.ORIENTATION_ROTATE_180) rotation = 180;
                    else if (o == ExifInterface.ORIENTATION_ROTATE_270) rotation = 270;
                }
            } catch (Exception ignored) {
                // No EXIF info: keep as-is.
            }

            float scale = Math.min(1f, MAX_WALLPAPER_PX / (float) Math.max(bmp.getWidth(), bmp.getHeight()));
            Matrix m = new Matrix();
            if (scale < 1f) m.postScale(scale, scale);
            if (rotation != 0) m.postRotate(rotation);
            if (scale < 1f || rotation != 0) {
                bmp = Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), m, true);
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.JPEG, 80, bos);
            return "data:image/jpeg;base64," + Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP);
        } catch (Exception | OutOfMemoryError e) {
            return null;
        }
    }

    /** Writes Downloads/MK6-Console-backup.json (Android 10+), replacing the previous one. */
    private boolean writeBackup(String json) {
        if (json == null || Build.VERSION.SDK_INT < 29) return false;
        try {
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            if (bytes.length == 0 || bytes.length > MAX_IMPORT_BYTES) return false;
            ContentResolver cr = getContentResolver();
            Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
            try {
                cr.delete(collection,
                        MediaStore.MediaColumns.DISPLAY_NAME + "=? AND " + MediaStore.MediaColumns.RELATIVE_PATH + "=?",
                        new String[]{BACKUP_NAME, Environment.DIRECTORY_DOWNLOADS + "/"});
            } catch (RuntimeException ignored) {
            }
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, BACKUP_NAME);
            v.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            Uri item = cr.insert(collection, v);
            if (item == null) return false;
            try (OutputStream os = cr.openOutputStream(item, "wt")) {
                if (os == null) return false;
                os.write(bytes);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void readModelExtra(Intent intent) {
        if (intent == null) return;
        String model = intent.getStringExtra("model");
        if (model != null && model.matches(MODEL_ID)) pendingModel = model;
        intent.removeExtra("model");
    }

    private void deliverModel() {
        if (!pageReady || pendingModel == null || web == null) return;
        String js = "window.openModel&&window.openModel(" + JSONObject.quote(pendingModel) + ")";
        pendingModel = null;
        web.post(() -> web.evaluateJavascript(js, null));
    }

    private Intent modelIntent(String id) {
        Intent i = new Intent(this, MainActivity.class);
        i.setAction(Intent.ACTION_VIEW);
        i.putExtra("model", id);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return i;
    }

    private ShortcutInfo shortcutFor(String prefix, String id, String name) {
        String label = name != null && !name.trim().isEmpty() ? name.trim() : "Model";
        String shortLabel = label.length() > 10 ? label.substring(0, 10) : label;
        return new ShortcutInfo.Builder(this, prefix + id)
                .setShortLabel(shortLabel)
                .setLongLabel(label)
                .setIcon(Icon.createWithResource(this, R.mipmap.ic_launcher))
                .setIntent(modelIntent(id))
                .build();
    }

    // ---------------------------------------------------------------- native -> JS

    private void notifyPage(String state) {
        if (web == null) return;
        web.post(() -> web.evaluateJavascript("window.onHubState&&window.onHubState('" + state + "')", null));
    }

    private void notifyApp(String event) {
        if (web == null) return;
        web.post(() -> web.evaluateJavascript("window.onAppEvent&&window.onAppEvent('" + event + "')", null));
    }

    private void notifyFile(String kind, String result) {
        if (web == null) return;
        web.post(() -> web.evaluateJavascript(
                "window.onFileResult&&window.onFileResult('" + kind + "','" + result + "')", null));
    }

    private void notifyWall(String slot, String dataUrl) {
        if (web == null) return;
        String js = "window.onWallpaper&&window.onWallpaper(" + JSONObject.quote(slot) + ","
                + (dataUrl == null ? "null" : JSONObject.quote(dataUrl)) + ")";
        web.post(() -> web.evaluateJavascript(js, null));
    }

    // ---------------------------------------------------------------- JS bridge

    private final class Bridge {

        /** @param mods comma separated hub indices, e.g. "0" or "0,1" */
        @JavascriptInterface
        public void start(String mods) {
            int[] parsed = parseMods(mods);
            runOnUiThread(() -> {
                if (parsed == null) notifyPage("error");
                else requestStart(parsed);
            });
        }

        /** @param frame 6/12/18 comma separated channel values -100..100 */
        @JavascriptInterface
        public void send(String frame) {
            int[] parsed = parseFrame(frame);
            if (parsed == null) return;
            runOnUiThread(() -> mk6.setFrame(parsed));
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> mk6.stop());
        }

        @JavascriptInterface
        public void haptic(String kind) {
            long[] pattern;
            if ("estop".equals(kind)) pattern = new long[]{0, 90, 70, 90};
            else if ("warn".equals(kind)) pattern = new long[]{0, 200, 100, 200, 100, 200};
            else if ("lost".equals(kind)) pattern = new long[]{0, 300};
            else if ("ok".equals(kind)) pattern = new long[]{0, 13};
            else if ("dial".equals(kind)) pattern = new long[]{0, 15};
            else if ("hold".equals(kind)) pattern = new long[]{0, 35};
            else pattern = new long[]{0, 13};
            runOnUiThread(() -> buzz(pattern));
        }

        @JavascriptInterface
        public void tilt(boolean on) {
            runOnUiThread(() -> setTilt(on));
        }

        @JavascriptInterface
        public void immersive(boolean on) {
            runOnUiThread(() -> {
                fullScreen = on;
                applyFull();
            });
        }

        @JavascriptInterface
        public int battery() {
            try {
                Intent b = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
                if (b == null) return -1;
                int level = b.getIntExtra("level", -1);
                int scale = b.getIntExtra("scale", -1);
                if (level < 0 || scale <= 0) return -1;
                return Math.round(level * 100f / scale);
            } catch (RuntimeException e) {
                return -1;
            }
        }

        @JavascriptInterface
        public boolean btOn() {
            try {
                BluetoothManager bm = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
                BluetoothAdapter a = bm != null ? bm.getAdapter() : null;
                return a != null && a.isEnabled();
            } catch (RuntimeException e) {
                return false;
            }
        }

        @JavascriptInterface
        public void btSettings() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(android.provider.Settings.ACTION_BLUETOOTH_SETTINGS));
                } catch (RuntimeException ignored) {
                }
            });
        }

        @JavascriptInterface
        public void exportFile(String fileName, String json) {
            runOnUiThread(() -> {
                pendingExport = json;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("application/json");
                i.putExtra(Intent.EXTRA_TITLE, fileName);
                try {
                    startActivityForResult(i, REQ_EXPORT);
                } catch (RuntimeException e) {
                    pendingExport = null;
                    notifyFile("export", "fail");
                }
            });
        }

        @JavascriptInterface
        public void importFile() {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(i, REQ_IMPORT);
                } catch (RuntimeException e) {
                    notifyFile("import", "fail");
                }
            });
        }

        @JavascriptInterface
        public void pickWallpaper(String slot) {
            runOnUiThread(() -> {
                pendingWall = slot;
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("image/*");
                try {
                    startActivityForResult(i, REQ_WALL);
                } catch (RuntimeException e) {
                    pendingWall = null;
                    notifyWall(slot, null);
                }
            });
        }

        @JavascriptInterface
        public void autoBackup(String json) {
            new Thread(() -> notifyApp(writeBackup(json) ? "backupok" : "backupfail")).start();
        }

        @JavascriptInterface
        public void pinModel(String id, String name) {
            runOnUiThread(() -> {
                try {
                    ShortcutManager sm = getSystemService(ShortcutManager.class);
                    if (sm != null && sm.isRequestPinShortcutSupported() && id != null && id.matches(MODEL_ID)) {
                        sm.requestPinShortcut(shortcutFor("pin_", id, name), null);
                        return;
                    }
                    notifyApp("nopin");
                } catch (RuntimeException e) {
                    notifyApp("nopin");
                }
            });
        }

        /** @param json [{"id":"...","name":"..."}, ...] — up to 4 launcher shortcuts */
        @JavascriptInterface
        public void shortcuts(String json) {
            runOnUiThread(() -> {
                try {
                    ShortcutManager sm = getSystemService(ShortcutManager.class);
                    if (sm == null) return;
                    JSONArray arr = new JSONArray(json);
                    List<ShortcutInfo> list = new ArrayList<>();
                    int n = Math.min(arr.length(), Math.min(4, sm.getMaxShortcutCountPerActivity()));
                    for (int i = 0; i < n; i++) {
                        JSONObject o = arr.getJSONObject(i);
                        String id = o.optString("id", "");
                        if (!id.matches(MODEL_ID)) continue;
                        list.add(shortcutFor("dyn_", id, o.optString("name", "")));
                    }
                    sm.setDynamicShortcuts(list);
                } catch (Exception ignored) {
                }
            });
        }
    }
}
