# Android Development Guide

This document covers the challenges, workarounds, and setup required to develop and test Flux on Android via Capacitor.

## Prerequisites

- **JDK 21** — required by the Android Gradle plugin
  ```bash
  # macOS (Homebrew)
  brew install openjdk@21
  export JAVA_HOME=/opt/homebrew/opt/openjdk@21
  ```
- **Android SDK** — install via Android Studio or standalone SDK tools
  - Ensure `~/Library/Android/sdk` exists (or set `ANDROID_SDK_ROOT`)
  - Create `android/local.properties` (gitignored):
    ```properties
    sdk.dir=/Users/<you>/Library/Android/sdk
    ```
- **ADB** — for deploying to a physical device over USB

## Building the APK

```bash
cd app

# Sync Capacitor native projects with web build
npx cap sync android

# Build debug APK
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
cd android && ./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk (~15MB)
```

## Installing on Device

```bash
# Install (overwrites existing)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Full uninstall + reinstall (clears all app data)
adb uninstall org.coasys.flux
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Connecting to a Development AD4M Executor

This is where most of the complexity lies. The Capacitor WebView has strict security policies that make connecting to a local development executor surprisingly difficult.

### The Core Problem

Capacitor serves the app from `https://localhost` by default. This creates a cascade of issues:

1. **Mixed content blocking** — `https://localhost` cannot open `ws://` WebSocket connections to a local executor. The browser engine blocks them as insecure.
2. **Self-signed certificate rejection** — Using `wss://` with a self-signed cert fails because Android's WebView doesn't trust user-installed CA certificates by default.
3. **Certificate installation on Android** — Installing a custom CA certificate on Android requires navigating Settings → Security → Install from device storage, and it must be installed as a "CA certificate" (not "VPN and app user certificate"). Some Android versions/OEMs make this difficult or reject PEM files with "Private key required" errors.
4. **Full chain certificates required** — Android's TLS stack requires the server to send the full certificate chain (server cert + intermediate + root CA). A standalone self-signed cert is insufficient.

### The Working Solution: HTTP Scheme + Cleartext Traffic

The simplest approach that actually works for development:

#### 1. Set Capacitor to use HTTP scheme

In `capacitor.config.ts`:
```typescript
server: {
  androidScheme: 'http',  // Default is 'https'
}
```

This makes Capacitor serve the app from `http://localhost` instead of `https://localhost`, which allows `ws://` WebSocket connections.

#### 2. Enable cleartext traffic in Android

In `AndroidManifest.xml`, add to the `<application>` tag:
```xml
android:networkSecurityConfig="@xml/network_security_config"
android:usesCleartextTraffic="true"
```

Create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

This allows the WebView to make HTTP/WS requests to any host, and trusts user-installed certificates.

#### 3. Run the executor bound to all interfaces

```bash
ad4m-executor run \
  --app-data-path /tmp/ad4m-dev-data \
  --gql-port 12000 \
  --admin-credential hextest123 \
  --localhost false \
  --connect-holochain true \
  --hc-use-mdns true \
  --hc-use-bootstrap true
```

The `--localhost false` flag binds the HTTP server to `0.0.0.0` instead of `127.0.0.1`.

#### 4. CORS proxy required

The AD4M executor does not handle CORS preflight (`OPTIONS`) requests. When the WebView makes cross-origin requests to the executor, the preflight fails with `405 Method Not Allowed`.

Run a simple CORS proxy:

```javascript
// cors-proxy.js
const http = require('http');
const net = require('net');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  const opts = { hostname: '127.0.0.1', port: 12000, path: req.url, method: req.method, headers: req.headers };
  delete opts.headers.host;
  const proxy = http.request(opts, (pRes) => {
    pRes.headers['access-control-allow-origin'] = '*';
    res.writeHead(pRes.statusCode, pRes.headers);
    pRes.pipe(res);
  });
  proxy.on('error', () => { res.writeHead(502); res.end('Proxy error'); });
  req.pipe(proxy);
});

server.on('upgrade', (req, socket, head) => {
  const target = net.createConnection(12000, '127.0.0.1', () => {
    const reqStr = `${req.method} ${req.url} HTTP/1.1\r\n` +
      Object.entries(req.headers).map(([k,v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n';
    target.write(reqStr);
    if (head.length) target.write(head);
    socket.pipe(target).pipe(socket);
  });
  target.on('error', () => socket.destroy());
  socket.on('error', () => target.destroy());
});

server.listen(12002, '0.0.0.0', () => console.log('CORS proxy on 0.0.0.0:12002'));
```

```bash
node cors-proxy.js
```

#### 5. Connect the app

The phone needs to reach the CORS proxy. Options:
- **Same Wi-Fi network** — use the dev machine's LAN IP (e.g., `ws://192.168.1.x:12002/graphql`)
- **USB via ADB reverse** — `adb reverse tcp:12002 tcp:12002` (note: does not work reliably with Capacitor's `localhost` origin)

Then inject via Chrome DevTools (see "Remote Debugging" below) or use ad4m-connect's "Remote Node" UI.

### Production TLS Connection

For connecting to a production executor with proper TLS certificates (e.g., `wss://lucksus.ad4m.dev:12001/graphql`), the default `https://localhost` Capacitor scheme works. The server must present a full certificate chain signed by a trusted CA (Let's Encrypt, etc.). Self-signed certificates will not work without additional Android configuration.

## Remote Debugging via Chrome DevTools

Connect the phone via USB with USB debugging enabled.

```bash
# List connected devices
adb devices

# Find the WebView DevTools socket
adb shell cat /proc/net/unix | grep webview_devtools

# Forward to localhost
adb forward tcp:9222 localabstract:webview_devtools_remote_<PID>

# List debuggable pages
curl http://localhost:9222/json
```

Then connect via WebSocket to `ws://localhost:9222/devtools/page/<TARGET_ID>` using the Chrome DevTools Protocol (CDP). This allows:
- Inspecting localStorage
- Evaluating JavaScript in the WebView context
- Injecting auth tokens
- Navigating the app programmatically

Alternatively, open `chrome://inspect/#devices` in Chrome on the dev machine to use the visual DevTools inspector.

### Injecting Auth (Admin Token Bypass)

For development, bypass ad4m-connect's login flow by injecting the admin token directly:

```javascript
// Via CDP Runtime.evaluate
const el = document.querySelector('ad4m-connect');
const core = el.core;
core.url = 'ws://192.168.1.x:12002/graphql';
core.token = 'hextest123';  // Must match --admin-credential
await core.buildClient();
await core.connect();
await core.checkAuth();
await core.ad4mClient.agent.unlock('test');
// Navigate past login
window.location.hash = '#/home';
```

## Known Issues & Gotchas

### Package name mismatch
The Gradle namespace is `org.coasys.flux` but the Java source is under `com.coasys.flux`. The `applicationId` is `org.coasys.flux`. This works because Android's build system handles the mapping, but it can cause confusion when launching activities via `adb shell am start`.

### WebView vs Chrome cert stores are separate
Accepting a self-signed certificate in Chrome on the phone does NOT make it trusted in the Capacitor WebView. They maintain separate trust stores.

### `adb reverse` doesn't reliably work with Capacitor
`adb reverse tcp:12000 tcp:12000` makes the dev machine's port accessible as the phone's `localhost:12000`, but Capacitor's WebView already uses `localhost` for serving the app itself. Requests to `http://localhost:12000` from the WebView may conflict.

### App reinstall vs overlay install
`adb install -r` (overlay) preserves app data including localStorage. If you change the AndroidManifest or network security config, you may need a full uninstall (`adb uninstall org.coasys.flux`) followed by a fresh install for the changes to take effect.

### Missing `google-services.json`
Push notifications (`@capacitor/push-notifications`) require a Firebase `google-services.json` in `android/app/`. Without it, push notification features will not work. The build still succeeds.

### No release signing configured
Only debug builds are available. Release builds require a keystore configuration in `android/app/build.gradle`.

## iOS Development

iOS builds require full Xcode (not just command line tools). The `ios/` directory and Podfile are present but untested with Capacitor 7.x. Run `npx cap sync ios && cd ios/App && pod install` to set up, then build via Xcode.
