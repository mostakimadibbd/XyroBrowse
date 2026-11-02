import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('Download Portal - verification of generated 1-click packages', () => {
  const downloadsDir = path.resolve(process.cwd(), 'public', 'downloads');

  const files = [
    { name: 'XyroBrowse-Setup-x64.exe', minSize: 1000 },
    { name: 'XyroBrowse-Universal.dmg', minSize: 1000 },
    { name: 'XyroBrowse-v0.1.0.apk', minSize: 500 },
    { name: 'XyroBrowse-x86_64.AppImage', minSize: 100 },
  ];

  for (const f of files) {
    const fullPath = path.join(downloadsDir, f.name);
    assert.equal(fs.existsSync(fullPath), true, `Installer ${f.name} should exist`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size >= f.minSize, `Installer ${f.name} should have non-trivial size`);
  }
});

test('Download Portal - format magic signatures', () => {
  const downloadsDir = path.resolve(process.cwd(), 'public', 'downloads');

  // Windows EXE magic: 'MZ'
  const winBuf = fs.readFileSync(path.join(downloadsDir, 'XyroBrowse-Setup-x64.exe'));
  assert.equal(winBuf.toString('ascii', 0, 2), 'MZ');

  // Android APK magic: ZIP signature PK\x03\x04
  const apkBuf = fs.readFileSync(path.join(downloadsDir, 'XyroBrowse-v0.1.0.apk'));
  assert.equal(apkBuf.readUInt32LE(0), 0x04034b50);

  // Linux AppImage magic: \x7fELF and 'AI\x02' at byte 8
  const linuxBuf = fs.readFileSync(path.join(downloadsDir, 'XyroBrowse-x86_64.AppImage'));
  assert.equal(linuxBuf[0], 0x7f);
  assert.equal(linuxBuf.toString('ascii', 1, 4), 'ELF');
  assert.equal(linuxBuf.toString('ascii', 8, 10), 'AI');
  assert.equal(linuxBuf[10], 0x02);

  // macOS DMG trailer: 'koly' at last 512 bytes
  const macBuf = fs.readFileSync(path.join(downloadsDir, 'XyroBrowse-Universal.dmg'));
  const kolyOffset = macBuf.length - 512;
  assert.equal(macBuf.toString('ascii', kolyOffset, kolyOffset + 4), 'koly');
});
