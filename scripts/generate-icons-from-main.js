const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const mainIconPath = path.join(iconsDir, 'main-icon.png');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Check if main icon exists
if (!fs.existsSync(mainIconPath)) {
  console.error('❌ main-icon.png not found at:', mainIconPath);
  process.exit(1);
}

console.log('📦 Generating PWA icons from main-icon.png...\n');

// Generate all icon sizes
const generateIcons = async () => {
  try {
    // Generate PWA icons
    for (const size of sizes) {
      await sharp(mainIconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      
      console.log(`✓ Created icon-${size}x${size}.png`);
    }

    // Generate favicon.ico (32x32)
    await sharp(mainIconPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'favicon-32x32.png'));
    console.log('✓ Created favicon-32x32.png');

    // Generate favicon.ico (16x16)
    await sharp(mainIconPath)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'favicon-16x16.png'));
    console.log('✓ Created favicon-16x16.png');

    // Generate apple-touch-icon
    await sharp(mainIconPath)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'));
    console.log('✓ Created apple-touch-icon.png');

    // Generate app logo (for login/header pages)
    await sharp(mainIconPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'app-logo.png'));
    console.log('✓ Created app-logo.png');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
};

generateIcons();










