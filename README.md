# Fakultair FTI 2026 — Official Linktree (Vite Vanilla)

Website static Linktree / Link-in-Bio profesional dan modern untuk **Fakultair FTI 2026** menggunakan **Vite (Vanilla)** sebagai dev environment & asset bundler.

---

## ⚡ Tech Stack

- **Vite (Vanilla)** — Lightning-fast development server & static asset bundler
- **HTML5** — Semantic markup & OpenGraph SEO tags
- **CSS3** — Vanilla CSS dengan Design Tokens, CSS Variables (`Deep Sea Neon` theme), & CSS Modules layout
- **Vanilla JavaScript (ES6+)** — Zero-dependency staggered animation & interaction tracking
- **SVG** — Vector graphics untuk logo, background pattern, dan icon set

---

## 📁 Struktur Project

```text
linktree-fakultair2026/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── assets/
│       ├── background/
│       │   └── bg-pattern.svg
│       └── logo/
│           └── fakultair-logo.svg
├── src/
│   ├── css/
│   │   ├── variables.css      # Design tokens (Deep Sea Neon)
│   │   ├── reset.css          # CSS reset & base styles
│   │   ├── style.css          # Main component styles
│   │   └── responsive.css     # Media queries
│   ├── js/
│   │   ├── main.js            # Entry point
│   │   ├── animation.js       # Staggered entrance animation
│   │   └── utils.js           # Interaction utilities
│   └── assets/
├── index.html                 # Root HTML template
├── package.json               # Project dependencies & scripts
├── vite.config.js             # Vite configuration
├── .gitignore
├── vercel.json                # Vercel deployment config
└── README.md
```

---

## 🛠️ Perintah Pengembangan (Development Commands)

### 1. Install Dependensi
```bash
npm install
```

### 2. Jalankan Dev Server
```bash
npm run dev
```

### 3. Build untuk Production
```bash
npm run build
```

### 4. Preview Hasil Production Build
```bash
npm run preview
```

---

## ☁️ Deployment ke Vercel

Project ini siap di-deploy langsung ke Vercel:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework Preset**: `Vite`

---

## 📝 Lisensi & Hak Cipta

© 2026 Fakultair FTI. All rights reserved.
