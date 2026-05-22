# Motion Dash – Projektregeln

## Architektur
- UI ist eine **Single-Page-App** in `index.html` (inline CSS + inline JS, kein Build-Step)
- `login.html` ist die separate Login-Seite
- Backend: **Supabase** (Postgres + Realtime + Edge Functions)
- PWA mit Service Worker (`sw.js`) und `manifest.json`

## Nach jedem Commit: SW-Version bumpen
`sw.js` enthält `const CACHE = 'motion-v1.x'`. Die Patch-Zahl **muss nach jedem Commit um 1 erhöht werden**, damit PWA-Clients den neuen Stand laden.

```js
// Beispiel: vor dem Commit
const CACHE = 'motion-v1.111';
// nach dem Commit → wird zu
const CACHE = 'motion-v1.112';
```

## Design-System
- Alle Farben ausschließlich über **CSS-Variablen** aus `:root` — keine hardcodierten Hex-Werte im CSS
- Akzentfarbe: `--copper` / `--copper-bright` (#C87A3A / #F0AD6E)
- Hintergründe: `--bg` → `--surface` → `--surface2` → `--surface3` (aufsteigend heller)
- `--bg-deep` nur für Overlays/Tooltips, nicht für Panel-Hintergründe

## Sprache
- UI-Texte auf **Deutsch**
- Commit-Messages können Deutsch oder Englisch sein

## Git
- Kein direkter Push auf `main`
- SW-Bump im selben Commit wie die eigentliche Änderung

## Supabase
- Tabellen: `motion_events`, `door_events`, `notify_settings`
- Edge Functions unter `supabase/functions/`
- Kein Schemachange ohne Migrations-SQL unter `supabase/`
