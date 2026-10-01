import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(root, 'android', 'app', 'src', 'main', 'java', 'pl', 'partyjniak', 'app');
const mainActivityPath = path.join(packagePath, 'MainActivity.java');
const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const drawableDir = path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable');
const iconSource = path.join(root, 'dist', 'assets', 'icons', 'icon-maskable-512.png');
const iconTarget = path.join(drawableDir, 'partyjniak_icon.png');

await mkdir(packagePath, { recursive: true });
await mkdir(drawableDir, { recursive: true });

await writeFile(mainActivityPath, `package pl.partyjniak.app;\n\nimport android.graphics.Color;\nimport android.os.Bundle;\nimport android.view.WindowManager;\nimport androidx.core.view.WindowCompat;\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n\n        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);\n        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);\n        getWindow().setStatusBarColor(Color.parseColor(\"#06111D\"));\n        getWindow().setNavigationBarColor(Color.parseColor(\"#020617\"));\n\n        if (getBridge() != null && getBridge().getWebView() != null) {\n            getBridge().getWebView().setHapticFeedbackEnabled(false);\n            getBridge().getWebView().setOnLongClickListener(view -> true);\n        }\n    }\n}\n`, 'utf8');

await copyFile(iconSource, iconTarget);

let manifest = await readFile(manifestPath, 'utf8');
manifest = manifest
  .replace(/android:icon="@mipmap\/ic_launcher"/g, 'android:icon="@drawable/partyjniak_icon"')
  .replace(/android:roundIcon="@mipmap\/ic_launcher_round"/g, 'android:roundIcon="@drawable/partyjniak_icon"')
  .replace(/<activity([\s\S]*?)android:name="\.MainActivity"([\s\S]*?)>/, match => {
    if (match.includes('android:screenOrientation=')) return match;
    return match.replace('>', '\n            android:screenOrientation="portrait">');
  });
await writeFile(manifestPath, manifest, 'utf8');

console.log('Applied Partyjniak Android native settings: cropped launcher icon, portrait mode, KEEP_SCREEN_ON, system insets and disabled WebView long-press haptics.');
