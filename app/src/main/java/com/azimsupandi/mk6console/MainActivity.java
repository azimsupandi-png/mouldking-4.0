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
import android.content.pm.ActivityInfo;
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
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.util.Base64;
import android.graphics.Color;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.widget.FrameLayout;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
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
 * JS -> native: MK6Bridge.start/send/stop/stats/haptic/tilt/immersive/battery/btOn/
 *               btSettings/exportFile/importFile/pickWallpaper/autoBackup/
 *               shortcuts/theme/textZoom/shareFile
 * native -> JS: window.onHubState, onAppEvent, onTilt, onFileResult,
 *               onImportText, onWallpaper, openModel, onSharedModel
 */
public class MainActivity extends Activity {

    private static final String PAGE = "file:///android_asset/index.html";
    private static final String ASSET_PREFIX = "file:///android_asset/";
    private static final String REPO_URL = "https://github.com/azimsupandi-png/";
    private static final String RELEASE_API = "";
    private static final String MODEL_ID = "[A-Za-z0-9_-]{1,40}";
    private static final String BACKUP_NAME = "MK6-Console-backup.json";
    private static final int MAX_IMPORT_BYTES = 1024 * 1024;
    private static final int MAX_WALLPAPER_PX = 1600;
    private static final long TILT_MIN_MS = 16L;

    private static final int REQ_BLUETOOTH = 41;
    private static final int REQ_EXPORT = 42;
    private static final int REQ_IMPORT = 43;
    private static final int REQ_WALL = 44;
    private static final int REQ_SCAN = 45;

    private WebView web;
    private FrameLayout root;
    private boolean barLight;
    private int barColor = 0xFF1B1E23;
    private String pendingShared;
    private HubLink mk6;
    private BleInspector inspector;
    private Vibrator vibrator;
    private SensorManager sm;

    private boolean pageReady;
    private boolean fullScreen = true;
    private boolean tiltOn;
    private long lastTilt;
    private boolean btReceiverOn;

    private HubSpec pendingSpec;
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
        inspector = new BleInspector(adapter);
        mk6 = new HubLink(this, adapter, state -> {
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
        root = new FrameLayout(this);
        root.setBackgroundColor(barColor);
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);
        setupEdgeToEdge();
        web.setHapticFeedbackEnabled(false);
        web.setLongClickable(false);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        // A model shortcut (or a shared file) is acted on once, when it is really tapped. Android hands the
        // same old intent back when the app is reopened from Recents or rebuilt after it was closed in the
        // background; acting on it again switched to the shortcut's model (other wiring, other hubs) by itself.
        boolean fresh = savedInstanceState == null
                && (getIntent().getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) == 0;
        if (fresh) {
            readModelExtra(getIntent());
            readSharedFile(getIntent());
        } else {
            getIntent().removeExtra("model");
            getIntent().setData(null);
            getIntent().removeExtra(Intent.EXTRA_STREAM);
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                deliverModel();
                deliverShared();
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
        readSharedFile(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            web.onResume();
            web.resumeTimers();
        }
        notifyApp("resume");
        if (!mk6.isActive() && pendingSpec == null) notifyPage("stopped");
    }

    @Override
    protected void onPause() {
        // Safety: never keep driving a model while the app is in the background.
        mk6.stop();
        if (inspector != null) inspector.stop();
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

    /**
     * Volume Up is the emergency stop while the app is open: one press turns E-Stop on (the page
     * releases it only from its red banner). The key never changes the volume here; Volume Down still does.
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_VOLUME_UP && web != null && pageReady) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                ConnLog.add("Volume Up: E-Stop");
                web.evaluateJavascript("window.mk6VolUp&&window.mk6VolUp()", null);
            }
            return true;
        }
        // Gamepad buttons: the first press of each key is logged (to tell which code a controller sends),
        // and the stick buttons are also passed to the page directly, for controllers whose L3 / R3
        // never reach the page's gamepad buttons 10 and 11.
        if (KeyEvent.isGamepadButton(event.getKeyCode()) && web != null && pageReady && event.getRepeatCount() == 0) {
            int kc = event.getKeyCode();
            boolean down = event.getAction() == KeyEvent.ACTION_DOWN;
            if (down && padKeysSeen.add(kc)) ConnLog.add("Gamepad key: " + KeyEvent.keyCodeToString(kc));
            int idx = kc == KeyEvent.KEYCODE_BUTTON_THUMBL ? 10 : kc == KeyEvent.KEYCODE_BUTTON_THUMBR ? 11 : -1;
            if (idx >= 0 && (down || event.getAction() == KeyEvent.ACTION_UP)) {
                web.evaluateJavascript("window.mk6PadKey&&window.mk6PadKey(" + idx + "," + down + ")", null);
            }
        }
        return super.dispatchKeyEvent(event);
    }

    private final java.util.Set<Integer> padKeysSeen = new java.util.HashSet<>();

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
        if (requestCode == REQ_SCAN) {
            boolean ok = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (ok) inspector.start();
            else ConnLog.add("Scan: permission refused");
            return;
        }
        if (requestCode != REQ_BLUETOOTH) return;
        boolean all = grantResults.length > 0;
        for (int g : grantResults) if (g != PackageManager.PERMISSION_GRANTED) all = false;
        if (all && pendingSpec != null) {
            mk6.start(pendingSpec);
        } else {
            ConnLog.add("Bluetooth permission refused");
            notifyPage("denied");
        }
        pendingSpec = null;
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
                    ConnLog.add("Import: could not read the file (missing, or over 1 MB)");
                    notifyFile("import", "fail");
                    return;
                }
                ConnLog.add("Import: read " + text.length() + " characters");
                String js = "window.onImportText&&window.onImportText(" + JSONObject.quote(text) + ")";
                web.post(() -> web.evaluateJavascript(js, null));
            }
        } catch (Exception e) {
            ConnLog.add(kind + " failed: " + e.getClass().getSimpleName() + (e.getMessage() != null ? " " + e.getMessage() : ""));
            notifyFile(kind, "fail");
        }
    }

    // ---------------------------------------------------------------- helpers

    /** Full screen hides the system bars; otherwise the page sits between them (edge-to-edge, padded by insets). */
    @SuppressWarnings("deprecation")
    private void applyFull() {
        int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
        if (fullScreen) {
            flags |= View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        }
        if (barLight && Build.VERSION.SDK_INT < 30) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }
        try {
            getWindow().getDecorView().setSystemUiVisibility(flags);
        } catch (RuntimeException ignored) {
        }
        applyBarLook();
        if (root != null) root.requestApplyInsets();
    }

    /** Status / navigation bar icons dark on the light theme, light on the dark theme. */
    private void applyBarLook() {
        if (root != null) root.setBackgroundColor(barColor);
        if (Build.VERSION.SDK_INT >= 30) {
            try {
                WindowInsetsController c = getWindow().getInsetsController();
                if (c != null) {
                    int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                            | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                    c.setSystemBarsAppearance(barLight ? mask : 0, mask);
                }
            } catch (RuntimeException ignored) {
            }
        }
    }

    @SuppressWarnings("deprecation")
    private void setupEdgeToEdge() {
        try {
            if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
            if (Build.VERSION.SDK_INT >= 29) {
                getWindow().setNavigationBarContrastEnforced(false);
                getWindow().setStatusBarContrastEnforced(false);
            }
        } catch (RuntimeException ignored) {
        }
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int l = 0, t = 0, r = 0, b = 0;
            if (!fullScreen) {
                if (Build.VERSION.SDK_INT >= 30) {
                    android.graphics.Insets in = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                    l = in.left; t = in.top; r = in.right; b = in.bottom;
                } else {
                    l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                    r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
                }
            }
            web.setPadding(0, 0, 0, 0);
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) web.getLayoutParams();
            if (lp.leftMargin != l || lp.topMargin != t || lp.rightMargin != r || lp.bottomMargin != b) {
                lp.setMargins(l, t, r, b);
                web.setLayoutParams(lp);
            }
            // Full screen off: the page already sits between the bars (the margins above), so the WebView must not
            // also get the bar insets - newer WebViews turn them into CSS safe-area padding and the page would be
            // padded twice (an empty band above the navigation buttons).
            if (!fullScreen) {
                if (Build.VERSION.SDK_INT >= 30) return WindowInsets.CONSUMED;
                WindowInsets c = insets.consumeSystemWindowInsets();
                if (Build.VERSION.SDK_INT >= 28) c = c.consumeDisplayCutout();
                return c;
            }
            return insets;
        });
    }

    private void buzz(long[] pattern) {
        if (vibrator == null || !vibrator.hasVibrator()) return;
        try {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
        } catch (RuntimeException ignored) {
        }
    }

    private void requestStart(HubSpec spec) {
        if (Build.VERSION.SDK_INT >= 31) {
            java.util.ArrayList<String> need = new java.util.ArrayList<>();
            if (spec.advMods().length > 0
                    && checkSelfPermission(Manifest.permission.BLUETOOTH_ADVERTISE) != PackageManager.PERMISSION_GRANTED) {
                need.add(Manifest.permission.BLUETOOTH_ADVERTISE);
            }
            if (spec.hallCount() > 0
                    && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                need.add(Manifest.permission.BLUETOOTH_CONNECT);
            }
            if (!need.isEmpty()) {
                pendingSpec = spec;
                requestPermissions(need.toArray(new String[0]), REQ_BLUETOOTH);
                return;
            }
        }
        mk6.start(spec);
    }

    /** Starts the Bluetooth inspector scan, asking for the scan permission first when needed. */
    private void requestScan() {
        String perm = Build.VERSION.SDK_INT >= 31 ? Manifest.permission.BLUETOOTH_SCAN
                : Manifest.permission.ACCESS_FINE_LOCATION;
        if (checkSelfPermission(perm) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{perm}, REQ_SCAN);
            return;
        }
        inspector.start();
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

    /** A model file opened or shared from another app (WhatsApp, Files, e-mail…). */
    private void readSharedFile(Intent intent) {
        if (intent == null) return;
        Uri uri = null;
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action)) uri = intent.getData();
        else if (Intent.ACTION_SEND.equals(action)) {
            Object o = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (o instanceof Uri) uri = (Uri) o;
        }
        if (uri == null) return;
        final Uri u = uri;
        intent.setData(null);
        intent.removeExtra(Intent.EXTRA_STREAM);
        new Thread(() -> {
            String text = null;
            try {
                text = readLimited(u);
            } catch (Exception ignored) {
            }
            final String t = text;
            runOnUiThread(() -> {
                if (t == null) {
                    notifyApp("sharefail");
                    return;
                }
                pendingShared = t;
                deliverShared();
            });
        }).start();
    }

    private void deliverShared() {
        if (!pageReady || pendingShared == null || web == null) return;
        String js = "window.onSharedModel&&window.onSharedModel(" + JSONObject.quote(pendingShared) + ")";
        pendingShared = null;
        web.post(() -> web.evaluateJavascript(js, null));
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
            HubSpec parsed = HubSpec.parse(mods);
            runOnUiThread(() -> {
                if (parsed == null) {
                    ConnLog.add("Start refused: bad hub list '" + mods + "'");
                    notifyPage("error");
                } else requestStart(parsed);
            });
        }

        /** @param frame 6/12/18 comma separated channel values -100..100 */
        @JavascriptInterface
        public void send(String frame) {
            int[] parsed = parseFrame(frame);
            if (parsed == null) return;
            runOnUiThread(() -> mk6.setFrame(parsed));
        }

        /** Link diagnostics for the Hub screen (JSON text). */
        @JavascriptInterface
        public String stats() {
            final String[] out = {"{}"};
            final java.util.concurrent.CountDownLatch done = new java.util.concurrent.CountDownLatch(1);
            runOnUiThread(() -> {
                try {
                    out[0] = mk6.stats();
                } finally {
                    done.countDown();
                }
            });
            try {
                done.await(300, java.util.concurrent.TimeUnit.MILLISECONDS);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
            return out[0];
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> mk6.stop());
        }

        /** Options for the H4.0 / H6.0 hubs: stall protection, servo ports and end stops (JSON, see HubLink.configure). */
        @JavascriptInterface
        public void hallConfig(String json) {
            if (json == null || json.length() > 4000) return;
            runOnUiThread(() -> mk6.configure(json));
        }

        /** Connection log text (newest last). */
        @JavascriptInterface
        public String log() {
            return ConnLog.dump();
        }

        @JavascriptInterface
        public void clearLog() {
            ConnLog.clear();
        }

        /** Starts a 30 s Bluetooth scan for the inspector. */
        @JavascriptInterface
        public void scanStart() {
            runOnUiThread(() -> requestScan());
        }

        @JavascriptInterface
        public void scanStop() {
            runOnUiThread(() -> inspector.stop());
        }

        /** Inspector results as JSON text. */
        @JavascriptInterface
        public String scanResults() {
            return inspector.json();
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
            else if ("tap".equals(kind)) pattern = new long[]{0, 8};
            else if ("tick".equals(kind)) pattern = new long[]{0, 6, 40, 6};
            else if ("success".equals(kind)) pattern = new long[]{0, 10, 30, 25};
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

        /** "land" turns the screen sideways (either way); anything else gives rotation back to the phone. */
        @JavascriptInterface
        public void orient(String mode) {
            runOnUiThread(() -> setRequestedOrientation("land".equals(mode)
                    ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                    : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED));
        }

        /** Light theme: light bars with dark icons; dark theme: dark bars with light icons. */
        @JavascriptInterface
        public void theme(boolean light) {
            runOnUiThread(() -> {
                barLight = light;
                barColor = light ? 0xFFFFFFFF : 0xFF1B1E23;
                applyFull();
            });
        }

        /** Text size in percent (100 = normal). */
        @JavascriptInterface
        public void textZoom(int pct) {
            int p = Math.max(85, Math.min(150, pct));
            runOnUiThread(() -> {
                if (web != null) web.getSettings().setTextZoom(p);
            });
        }

        /** Share one model as a .json file through the Android share sheet. */
        @JavascriptInterface
        public void shareFile(String fileName, String json, String title) {
            String safe = fileName == null ? "model.mk6.json" : fileName.replaceAll("[^A-Za-z0-9 ._()-]", "_");
            if (safe.isEmpty() || safe.length() > 80) safe = "model.mk6.json";
            final String name = safe;
            new Thread(() -> {
                try {
                    byte[] bytes = (json == null ? "" : json).getBytes(StandardCharsets.UTF_8);
                    if (bytes.length == 0 || bytes.length > MAX_IMPORT_BYTES) throw new IOException("size");
                    File dir = ShareProvider.dir(MainActivity.this);
                    File[] old = dir.listFiles();
                    if (old != null) for (File f : old) //noinspection ResultOfMethodCallIgnored
                        f.delete();
                    try (FileOutputStream os = new FileOutputStream(new File(dir, name))) {
                        os.write(bytes);
                    }
                    Uri uri = ShareProvider.uriFor(name);
                    runOnUiThread(() -> {
                        try {
                            Intent send = new Intent(Intent.ACTION_SEND);
                            send.setType("application/json");
                            send.putExtra(Intent.EXTRA_STREAM, uri);
                            send.putExtra(Intent.EXTRA_SUBJECT, title != null ? title : name);
                            send.setClipData(android.content.ClipData.newRawUri(name, uri));
                            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            startActivity(Intent.createChooser(send, title != null ? title : name));
                        } catch (RuntimeException e) {
                            notifyApp("sharefail");
                        }
                    });
                } catch (Exception e) {
                    notifyApp("sharefail");
                }
            }).start();
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

        /** Version info for Settings: {"code":346,"name":"1.2","build":46,"date":"2026-11-13"} */
        @JavascriptInterface
        public String appInfo() {
            try {
                JSONObject o = new JSONObject();
                o.put("code", BuildConfig.VERSION_CODE);
                o.put("name", BuildConfig.VERSION_NAME);
                o.put("build", BuildConfig.VERSION_CODE - 300);
                o.put("date", BuildConfig.BUILD_DATE);
                return o.toString();
            } catch (Exception e) {
                return "{}";
            }
        }

        /** Asks GitHub for the latest release on a background thread; answers through window.onUpdate(json). */
        @JavascriptInterface
        public void checkUpdate() {
            new Thread(() -> {
                String res;
                HttpURLConnection c = null;
                try {
                    // test build (mouldking-4.0): no update check, so it never offers the stable APK
                    if (RELEASE_API.isEmpty()) throw new Exception("test build: update check is off");
                    c = (HttpURLConnection) new URL(RELEASE_API).openConnection();
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(8000);
                    c.setRequestProperty("Accept", "application/vnd.github+json");
                    c.setRequestProperty("User-Agent", "MK6Console");
                    int code = c.getResponseCode();
                    if (code != 200) {
                        res = "{\"error\":\"http " + code + "\"}";
                    } else {
                        ByteArrayOutputStream bo = new ByteArrayOutputStream();
                        try (InputStream in = c.getInputStream()) {
                            byte[] buf = new byte[8192];
                            int n;
                            while ((n = in.read(buf)) > 0 && bo.size() < 400_000) bo.write(buf, 0, n);
                        }
                        JSONObject j = new JSONObject(new String(bo.toByteArray(), StandardCharsets.UTF_8));
                        JSONObject o = new JSONObject();
                        o.put("name", j.optString("name", ""));
                        o.put("date", j.optString("published_at", ""));
                        o.put("page", j.optString("html_url", ""));
                        String body = j.optString("body", "");
                        o.put("notes", body.length() > 3000 ? body.substring(0, 3000) : body);
                        JSONArray as = j.optJSONArray("assets");
                        if (as != null) for (int i = 0; i < as.length(); i++) {
                            JSONObject a = as.getJSONObject(i);
                            if (a.optString("name", "").endsWith(".apk")) {
                                o.put("apk", a.optString("browser_download_url", ""));
                                break;
                            }
                        }
                        res = o.toString();
                    }
                } catch (Exception e) {
                    res = "{\"error\":\"net\"}";
                } finally {
                    if (c != null) c.disconnect();
                }
                String js = "window.onUpdate&&window.onUpdate(" + JSONObject.quote(res) + ")";
                web.post(() -> web.evaluateJavascript(js, null));
            }).start();
        }

        /** Opens the app's own GitHub page (release page or APK download) in the browser. */
        @JavascriptInterface
        public void openUrl(String url) {
            if (url == null || !url.startsWith(REPO_URL)) return;
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (RuntimeException ignored) {
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
