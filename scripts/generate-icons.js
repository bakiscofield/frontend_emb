const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, '../public/icon-512x512.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 Génération des icônes PWA...\n');

  // Vérifier que l'icône source existe
  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ Icône source non trouvée:', sourceIcon);
    process.exit(1);
  }

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(sourceIcon)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);

      console.log(`✅ ${size}x${size} créée`);
    } catch (error) {
      console.error(`❌ Erreur pour ${size}x${size}:`, error.message);
    }
  }

  console.log('\n✨ Génération terminée!');
}

generateIcons().catch(console.error);
