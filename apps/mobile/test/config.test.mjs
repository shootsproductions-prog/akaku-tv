// Guards the promises in docs/site/privacy.md: the built app must not ask for sensitive permissions.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = n => JSON.parse(readFileSync(fileURLToPath(new URL(`../${n}`, import.meta.url)), 'utf8'));
const { expo } = read('app.json');

test('the audio plugin does not request the microphone on iOS or Android', () => {
  const audio = expo.plugins.find(p => Array.isArray(p) && p[0] === 'expo-audio');
  assert.ok(audio, 'expo-audio plugin configured');
  assert.equal(audio[1].microphonePermission, false);
  assert.equal(audio[1].recordAudioAndroid, false);
});

test('no usage-description prompts or extra Android permissions are declared by hand', () => {
  const keys = Object.keys(expo.ios.infoPlist ?? {});
  assert.deepEqual(keys.filter(k => /UsageDescription$/.test(k)), []);
  assert.equal(expo.android.permissions, undefined, 'declare no extra Android permissions without updating the policy');
});

test('identity and build settings stay consistent', () => {
  assert.equal(expo.ios.bundleIdentifier, 'org.akaku.app');
  assert.equal(expo.android.package, 'org.akaku.app');
  assert.equal(expo.owner, 'shootsproductions');
  assert.equal(expo.ios.infoPlist.ITSAppUsesNonExemptEncryption, false);
  const eas = read('eas.json');
  assert.equal(eas.build.preview.android.buildType, 'apk', 'preview Android build installs directly');
  assert.equal(eas.build.production.autoIncrement, true);
});
