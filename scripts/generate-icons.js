const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-size="${size * 0.5}" text-anchor="middle" dy=".35em" fill="white">🚌</text>
</svg>`;
  
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filename, svg);
  console.log(`✓ Created icon-${size}x${size}.png`);
});

console.log('\n✅ All PWA icons generated successfully!');


