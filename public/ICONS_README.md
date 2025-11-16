# 🎨 Icônes EMB - Documentation

## 📦 Fichiers générés

Toutes les icônes nécessaires pour la PWA et le Play Store ont été créées :

### Icônes PWA (Progressive Web App)
- `icon-192x192.png` - 3.3 KB - Icône principale PWA
- `icon-512x512.png` - 13 KB - Icône haute résolution PWA
- `apple-touch-icon.png` - 3.3 KB - Icône pour iOS/Safari

### Favicons
- `favicon.svg` - 425 B - Favicon moderne (SVG)
- `favicon-32.png` - 1.1 KB - Favicon classique (PNG)

### Sources SVG (modifiables)
- `icon-192x192.svg` - 663 B - Source icône 192x192
- `icon-512x512.svg` - 670 B - Source icône 512x512

## 🎨 Design de l'icône

L'icône EMB représente :
- **Fond bleu** (#2563eb) - Couleur principale de l'application
- **Flèches d'échange** - Symbolisant la conversion Tmoney ↔ Flooz
  - Flèche jaune (#fbbf24) - Tmoney → Flooz
  - Flèche verte (#10b981) - Validation/succès
- **Texte "EMB"** - Nom de l'application en blanc

## ✅ Configuration

Les icônes sont déjà configurées dans :

### `manifest.json`
```json
{
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### `app/layout.tsx`
```tsx
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" sizes="192x192" href="/apple-touch-icon.png" />
```

## 🚀 Pour le Play Store

Icônes déjà prêtes :
- ✅ `icon-512x512.png` - Icône de l'application (512x512 requis)

Vous aurez aussi besoin de (à créer séparément) :
- Feature Graphic : 1024x500 PNG
- Screenshots : Minimum 2 captures d'écran

## 🔧 Régénérer les icônes

Si vous voulez modifier le design :

1. Éditez les fichiers SVG :
   - `icon-192x192.svg`
   - `icon-512x512.svg`

2. Régénérez les PNG :
   ```bash
   cd frontend
   node generate-icons.js convert
   ```

## 📱 Test PWA

Pour tester l'installation PWA :

1. Déployez l'application en ligne (HTTPS requis)
2. Ouvrez sur mobile
3. Le navigateur proposera "Ajouter à l'écran d'accueil"
4. L'icône apparaîtra sur votre écran d'accueil

## 🎯 Checklist Play Store

- ✅ Icône d'application (512x512) - **Créée**
- ⬜ Feature Graphic (1024x500) - À créer
- ⬜ Screenshots (minimum 2) - À créer
- ⬜ Description courte/longue - À rédiger
- ⬜ Politique de confidentialité - À créer

---

**Version:** 1.0.0
**Créé le:** 16 novembre 2025
