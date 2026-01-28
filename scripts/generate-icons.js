const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icônes PWA
const pwaIconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
// Favicon et Apple Touch Icon
const additionalIcons = [
  { size: 32, name: 'favicon-32.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];
// Icônes SVG
const svgIcons = [
  { size: 192, name: 'icon-192x192.svg' },
  { size: 512, name: 'icon-512x512.svg' },
  { size: 32, name: 'favicon.svg' }
];

const sourceIcon = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 Génération des icônes à partir de logo.png...\n');

  // Vérifier que l'icône source existe
  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ Icône source non trouvée:', sourceIcon);
    process.exit(1);
  }

  // Générer les icônes PWA
  console.log('📱 Génération des icônes PWA...');
  for (const size of pwaIconSizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(sourceIcon)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);

      console.log(`  ✅ icon-${size}x${size}.png créée`);
    } catch (error) {
      console.error(`  ❌ Erreur pour ${size}x${size}:`, error.message);
    }
  }

  // Générer favicon et apple-touch-icon
  console.log('\n🍎 Génération des icônes additionnelles...');
  for (const icon of additionalIcons) {
    const outputPath = path.join(outputDir, icon.name);

    try {
      await sharp(sourceIcon)
        .resize(icon.size, icon.size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);

      console.log(`  ✅ ${icon.name} créée`);
    } catch (error) {
      console.error(`  ❌ Erreur pour ${icon.name}:`, error.message);
    }
  }

  // Générer les SVG à partir du logo PNG
  console.log('\n🎨 Génération des fichiers SVG...');
  for (const icon of svgIcons) {
    const outputPath = path.join(outputDir, icon.name);

    try {
      // Convertir le PNG en buffer
      const pngBuffer = await sharp(sourceIcon)
        .resize(icon.size, icon.size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();

      // Convertir en base64
      const base64Image = pngBuffer.toString('base64');

      // Créer le SVG avec l'image embarquée
      const svgContent = `<svg width="${icon.size}" height="${icon.size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${icon.size}" height="${icon.size}" xlink:href="data:image/png;base64,${base64Image}"/>
</svg>`;

      fs.writeFileSync(outputPath, svgContent);
      console.log(`  ✅ ${icon.name} créée`);
    } catch (error) {
      console.error(`  ❌ Erreur pour ${icon.name}:`, error.message);
    }
  }

  console.log('\n✨ Toutes les icônes ont été générées à partir de logo.png!');
}

generateIcons().catch(console.error);
