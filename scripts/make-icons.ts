import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const svgPath = path.resolve('public/logo-mark.svg');
  if (!fs.existsSync(svgPath)) {
    throw new Error('public/logo-mark.svg not found');
  }

  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512, 1024];
  const publicDir = path.resolve('public');
  const buildDir = path.resolve('build');

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();

    // Write to public/icon-{size}.png
    fs.writeFileSync(path.join(publicDir, `icon-${size}.png`), pngBuffer);

    // Also write common sizes to build/
    if (size === 512) {
      fs.writeFileSync(path.join(buildDir, 'icon.png'), pngBuffer);
    }
    if (size === 256) {
      fs.writeFileSync(path.join(buildDir, 'icon-256.png'), pngBuffer);
    }
  }

  // Also write favicon.ico/png
  const favicon32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon32);

  console.log(`Generated ${sizes.length} icons in public/ and build/ successfully.`);
}

generateIcons().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
