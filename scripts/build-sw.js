const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building Service Worker...');

const workerPath = path.join(__dirname, '../worker/index.js');
const outputPath = path.join(__dirname, '../public/sw.js');

// Vérifier si le fichier source existe
if (!fs.existsSync(workerPath)) {
  console.error('❌ Fichier worker/index.js introuvable!');
  process.exit(1);
}

esbuild
  .build({
    entryPoints: [workerPath],
    bundle: true,
    outfile: outputPath,
    format: 'iife',
    target: 'es2020',
    minify: false, // Désactivé pour le debug
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    banner: {
      js: '// EMB Service Worker - Généré automatiquement\n// Ne pas modifier ce fichier directement, éditez worker/index.js\n',
    },
  })
  .then(() => {
    console.log('✅ Service Worker compilé avec succès!');
    console.log(`📁 Output: ${outputPath}`);

    // Afficher la taille du fichier
    const stats = fs.statSync(outputPath);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`📊 Taille: ${fileSizeInKB} KB`);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la compilation du Service Worker:', error);
    process.exit(1);
  });
