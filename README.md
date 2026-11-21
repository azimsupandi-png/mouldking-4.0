# MK6 Console

Android app to drive **Mould King 6.0** hubs (up to 3 at once) over Bluetooth LE advertising.
The UI is a web page (`app/src/main/assets/index.html` + `app.js`) hosted in a WebView; native
features are exposed to it via the `MK6Bridge` JavaScript interface. Target: Android 15 (API 35),
min Android 8 (API 26).

## Project layout

| Path | What |
|---|---|
| `app/src/main/assets/index.html` | UI markup + CSS |
| `app/src/main/assets/app.js` | UI code, loaded after the first frame |
| `app/src/main/assets/img/` | Knob images |
| `app/src/main/java/.../MainActivity.java` | WebView host + `MK6Bridge` (BLE start/stop/stats, haptics, tilt, files, wallpaper, backups, shortcuts, theme bars, text size, sharing); edge-to-edge insets |
| `app/src/main/java/.../ShareProvider.java` | Read-only provider for sharing one model file with other apps |
| `app/src/main/java/.../Mk6Advertiser.java` | BLE advertising state machine (connect handshake, parallel sets or rotation, neutral-before-stop) |
| `app/src/main/java/.../Mk6Crypt.java` | MK6 payload encoder (CRC16 + BLE whitening) |
| `docs/design/` | Final design sketches (screens + design system) |

## Tests

Every push runs the tests first; the APK is built and published only if they pass.

* `tests/jvm/` – runs the real `Mk6Advertiser` against stubbed Android classes and a fake
  clock: connect handshake, frames, safety watchdog (neutral after 500 ms without frames
  while moving), idle, stop, two hubs in rotation mode, and the link diagnostics.
* `tests/jvm/.../ProtocolTest.java` – the 6.0 connect telegram against the published capture, channel and
  nibble mapping, 6.0 and 4.0 telegram layout, and the connection log.
* `tests/ui/test_ui.py` – headless Chromium with a fake `MK6Bridge`: hub paths, practice
  mode, hold-to-start/stop with real touch events, idle DOM writes and update rate,
  no overflow at 360 px, gallery/hub/lock/back, no-hub widgets, empty states, light
  theme, diagnostics, text size / contrast, model sharing, recordings as quick buttons, trim,
  drive modes (and the old Speed setting folded into them), live meter, model colour, widget
  sizes, widget gallery, gamepad picture, quick settings, play-time limit, left-handed
  dashboard, the interactive guide, cruise, steering that eases at speed, reconnect when
  Bluetooth or the app comes back, practice simulator, model icon / photo, undo / redo,
  focus mode, and a click on every control of 13 screens.

```
javac -d build/jvmtest $(find tests/jvm -name '*.java') app/src/main/java/com/azimsupandi/mk6console/Mk6*.java app/src/main/java/com/azimsupandi/mk6console/ConnLog.java
java -cp build/jvmtest com.azimsupandi.mk6console.Mk6AdvertiserTest
java -cp build/jvmtest com.azimsupandi.mk6console.ProtocolTest
pip install playwright && python -m playwright install chromium && python tests/ui/test_ui.py
```

## Building

Every push to `main` builds a signed release APK with GitHub Actions:

* **Releases → `latest`** — `MK6-Console.apk` ready to install
* **Actions → run → Artifacts** — same APK

Locally (Android SDK required): `./gradlew assembleRelease` → `app/build/outputs/apk/release/`.

### Signing

Release builds are signed with `keystore/mk6-release.jks` (password `mk6console`, alias `mk6`)
so every build can be installed over the previous one. To use a private key instead, set
`MK6_KEYSTORE`, `MK6_KEYSTORE_PASSWORD`, `MK6_KEY_ALIAS`, `MK6_KEY_PASSWORD` in the build
environment.

## JS ↔ native API

JS → native (`window.MK6Bridge`): `start("0,1")`, `send("v1,…,v6[,…]")`, `stop()`,
`haptic(kind)`, `tilt(bool)`, `immersive(bool)`, `battery()`, `btOn()`, `btSettings()`,
`exportFile(name, json)`, `importFile()`, `pickWallpaper(slot)`, `autoBackup(json)`,
`pinModel(id, name)`, `shortcuts(json)`.

Native → JS: `onHubState(state)`, `onAppEvent(evt)`, `onTilt(x, y, rot)`,
`onFileResult(kind, result)`, `onImportText(text)`, `onWallpaper(slot, dataUrl)`, `openModel(id)`.
