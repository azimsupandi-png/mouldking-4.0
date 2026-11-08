# MK6 Console

Android app to drive **Mould King 6.0** hubs (up to 3 at once) over Bluetooth LE advertising.
The UI is a single web page (`app/src/main/assets/index.html`) hosted in a WebView; native
features are exposed to it via the `MK6Bridge` JavaScript interface.

## Project layout

| Path | What |
|---|---|
| `app/src/main/assets/index.html` | Complete UI (HTML/CSS/JS) |
| `app/src/main/java/.../MainActivity.java` | WebView host + `MK6Bridge` (BLE start/stop, haptics, tilt, files, wallpaper, backups, shortcuts) |
| `app/src/main/java/.../Mk6Advertiser.java` | BLE advertising state machine (connect handshake, parallel sets or rotation, neutral-before-stop) |
| `app/src/main/java/.../Mk6Crypt.java` | MK6 payload encoder (CRC16 + BLE whitening) |
| `docs/design/` | Final design sketches (screens + design system) |

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
