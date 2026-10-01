import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(root, 'android', 'app', 'src', 'main', 'java', 'pl', 'partyjniak', 'app');
const mainActivityPath = path.join(packagePath, 'MainActivity.java');
const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const drawableDir = path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable');
const iconTarget = path.join(drawableDir, 'partyjniak_icon.xml');

await mkdir(packagePath, { recursive: true });
await mkdir(drawableDir, { recursive: true });

await writeFile(mainActivityPath, `package pl.partyjniak.app;\n\nimport android.graphics.Color;\nimport android.os.Bundle;\nimport android.view.WindowManager;\nimport androidx.core.view.WindowCompat;\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n\n        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);\n        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);\n        getWindow().setStatusBarColor(Color.parseColor(\"#06111D\"));\n        getWindow().setNavigationBarColor(Color.parseColor(\"#020617\"));\n\n        if (getBridge() != null && getBridge().getWebView() != null) {\n            getBridge().getWebView().setHapticFeedbackEnabled(false);\n            getBridge().getWebView().setOnLongClickListener(view -> true);\n        }\n    }\n}\n`, 'utf8');

const iconVector = `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="108dp"\n    android:height="108dp"\n    android:viewportWidth="1548"\n    android:viewportHeight="1548">\n    <path\n        android:fillColor="#950F26"\n        android:pathData="M0,0H1548V1548H0Z" />\n    <group android:translateX="-466" android:translateY="-980">\n        <path\n            android:fillColor="#FFFFFF"\n            android:pathData="M880.899,1393.14l0,-12.892l0.54,0c0.208,-8.196 0.41,-14.365 0.467,-16.079c2.135,-65.219 45.697,-104.919 88.324,-118.85c24.065,-7.865 24.55,-7.46 316.421,-5.557c394.028,2.569 550.497,462.608 290.181,710.917c-122.357,116.713 -278.404,113.005 -279.057,113.217c-14.172,4.599 15.478,105.603 -32.649,159.055c-47.881,53.179 -68.077,45.967 -242.549,46.016c-4.9,-0.08 -9.801,0.004 -14.701,-0.076c-71.285,-1.163 -125.502,-52.965 -126.074,-130.188c-0.11,-14.923 -0.984,-132.958 -0.746,-210.489l-0.157,0l0,-181.946l224.123,0l67.838,135.331c37.743,75.291 129.528,105.787 204.818,68.042c75.376,-37.779 96.576,-126.147 68.931,-202.759l-114.311,-316.752c-16.127,-44.683 -62.085,-69.863 -110.304,-80.895c-24.109,-5.518 -49.297,-7.713 -73.35,-6.091c-24.051,1.624 -46.968,7.072 -66.517,16.875c-16.853,8.448 -30.926,20.066 -43.044,33.121l-158.184,0Zm327.741,85.137c0,17.278 -14.007,31.284 -31.284,31.284c-17.278,0 -31.286,-14.006 -31.286,-31.284c0,-17.278 14.008,-31.286 31.286,-31.286c17.276,0 31.284,14.008 31.284,31.286Zm0,139.611c0,17.278 -14.007,31.284 -31.284,31.284c-17.278,0 -31.286,-14.006 -31.286,-31.284c0,-17.278 14.008,-31.286 31.286,-31.286c17.276,0 31.284,14.007 31.284,31.286Zm38.521,-38.528c-17.278,0 -31.284,-14.008 -31.284,-31.286c0,-17.276 14.006,-31.284 31.284,-31.284c17.278,0 31.286,14.007 31.286,31.284c0,17.278 -14.008,31.286 -31.286,31.286Zm-139.604,0c-17.278,0 -31.286,-14.008 -31.286,-31.286c0,-17.276 14.008,-31.284 31.286,-31.284c17.278,0 31.284,14.007 31.284,31.284c0,17.278 -14.006,31.286 -31.284,31.286Z" />\n    </group>\n</vector>\n`;
await writeFile(iconTarget, iconVector, 'utf8');

let manifest = await readFile(manifestPath, 'utf8');
manifest = manifest
  .replace(/android:icon="@mipmap\/ic_launcher"/g, 'android:icon="@drawable/partyjniak_icon"')
  .replace(/android:roundIcon="@mipmap\/ic_launcher_round"/g, 'android:roundIcon="@drawable/partyjniak_icon"')
  .replace(/<activity([\s\S]*?)android:name="\.MainActivity"([\s\S]*?)>/, match => {
    if (match.includes('android:screenOrientation=')) return match;
    return match.replace('>', '\n            android:screenOrientation="portrait">');
  });
await writeFile(manifestPath, manifest, 'utf8');

console.log('Applied Partyjniak Android native settings: vector launcher icon, portrait mode, KEEP_SCREEN_ON, system insets and disabled WebView long-press haptics.');
