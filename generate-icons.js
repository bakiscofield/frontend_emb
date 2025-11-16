// Script pour générer les icônes PNG à partir des SVG
// Installer sharp: npm install sharp
const fs = require('fs');
const path = require('path');

// Instructions pour l'utilisateur
console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         🎨 Générateur d'icônes EMB                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📋 MÉTHODE 1 : Avec Sharp (Recommandé)
1. Installez sharp:
   npm install sharp

2. Lancez ce script:
   node generate-icons.js convert

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 MÉTHODE 2 : Convertir en ligne
1. Allez sur: https://cloudconvert.com/svg-to-png
2. Uploadez: public/icon-192x192.svg
3. Réglez la largeur à 192px
4. Téléchargez comme: icon-192x192.png
5. Répétez pour icon-512x512.svg (largeur: 512px)
6. Placez les PNG dans: public/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 MÉTHODE 3 : Utiliser Inkscape
1. Installez Inkscape: sudo apt install inkscape
2. Lancez ce script:
   node generate-icons.js inkscape

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Les fichiers SVG sont déjà créés dans public/
`);

const command = process.argv[2];

if (command === 'convert') {
  try {
    const sharp = require('sharp');

    const icons = [
      { input: 'icon-192x192.svg', output: 'icon-192x192.png', size: 192 },
      { input: 'icon-512x512.svg', output: 'icon-512x512.png', size: 512 }
    ];

    console.log('\n🔄 Conversion en cours...\n');

    icons.forEach(icon => {
      const inputPath = path.join(__dirname, 'public', icon.input);
      const outputPath = path.join(__dirname, 'public', icon.output);

      sharp(inputPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath)
        .then(() => {
          console.log(`✅ ${icon.output} créé avec succès!`);
        })
        .catch(err => {
          console.error(`❌ Erreur pour ${icon.output}:`, err.message);
        });
    });

    console.log('\n✨ Conversion terminée!\n');
  } catch (err) {
    console.error('\n❌ Sharp n\'est pas installé. Installez-le avec: npm install sharp\n');
  }
} else if (command === 'inkscape') {
  const { execSync } = require('child_process');

  const icons = [
    { input: 'icon-192x192.svg', output: 'icon-192x192.png', size: 192 },
    { input: 'icon-512x512.svg', output: 'icon-512x512.png', size: 512 }
  ];

  console.log('\n🔄 Conversion avec Inkscape...\n');

  icons.forEach(icon => {
    const inputPath = path.join(__dirname, 'public', icon.input);
    const outputPath = path.join(__dirname, 'public', icon.output);

    try {
      execSync(`inkscape "${inputPath}" --export-type=png --export-filename="${outputPath}" -w ${icon.size} -h ${icon.size}`);
      console.log(`✅ ${icon.output} créé avec succès!`);
    } catch (err) {
      console.error(`❌ Erreur pour ${icon.output}:`, err.message);
    }
  });

  console.log('\n✨ Conversion terminée!\n');
}
