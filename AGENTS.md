# AGENTS.md: Projekt-Anweisungen für kopfrechen-pwa

## Oberstes Gesetzbuch

Für alle Änderungen in `/Users/benkovert/kopfrechen-pwa` gilt verbindlich **[SPEC.md](./SPEC.md)** als oberstes Gesetzbuch. Lies `SPEC.md` vor jeder Bearbeitung von Code oder Oberfläche vollständig.

## Verbindliche Architektur-Regeln im Überblick

1. **Headless Core (`engine.js`)**: Kein `document`, `window`, `localStorage`, `querySelector` oder `getElementById`. Reine Logik mit sauberen JSON-Rückgaben.
2. **Speicher-Kapselung (`storage.js`)**: Alle Profilzugriffe laufen ausschließlich über `async loadUserData()` und `async saveUserData(data)` mit den Feldern `streak`, `highScore`, `lastPlayedDate`; kein `document`.
3. **State-Driven UI Gesetz (`ui.js`)**:
   - Keine visuellen Tailwind-Farb-, Sichtbarkeits- oder Animationsklassen (wie `bg-rose-500`, `text-rose-400`, `ring-emerald-400`, `animate-shake`, `hidden`, `flex`) im JavaScript-Code.
   - Kein `classList` oder `className` umschalten und kein direkter Zugriff auf `localStorage`.
   - Zustände werden ausschließlich über die definierten semantischen `data-*`-Attribute gesetzt (`data-screen` auf `document.body`, `data-state` auf `gameTimer` und `gameProgress`, `data-feedback` auf `questionCard`, `data-empty` auf `answerDisplay`, `data-visible` auf `endHighscoreBadge`).
4. **Defensives CSS (`index.html`)**: Übersetzung aller `data-*`-Attribute im `<style>`-Block (inklusive `prefers-reduced-motion`), stabiles `100dvh`-Layout mit `min-height: 0` ohne Abschneiden des Zahlenpads auf iPhones sowie Offline-/CDN-Fallback-Regeln.

## Pflicht-Prüfung und Abschluss-Workflow nach jeder Änderung

Jeder abgeschlossene Arbeitsschritt endet ausnahmslos mit folgender Abfolge:

1. **Tests ausführen**:
   ```bash
   node --test tests.mjs
   ```
   Alle Tests müssen grün durchlaufen (0 Fehler, keine übersprungenen Prüfungen).
2. **GitHub Commit und Push**:
   Sauberen Git-Commit mit verständlicher deutscher oder englischer Commit-Message erstellen und sofort `git push` auf `origin main` ausführen.
3. **Spiegel synchronisieren**:
   Direkt nach dem Commit/Push werden `CODE_SPIEGEL.md` im Projektordner und der Google-Drive-Spiegel (`~/Library/CloudStorage/GoogleDrive-kovertben@gmail.com/Meine Ablage/KI-Spiegel/kopfrechen-pwa/`) auf den aktuellen Stand gebracht.
