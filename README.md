# 432 vs 440 Hz Comparator

Static, English-first educational web app for comparing 432 Hz and 440 Hz tuning references with chord playback, frequency data and canvas-based audio visualization.

## Project Structure

```text
/
├── index.html
├── netlify.toml
├── robots.txt
├── sitemap.xml
├── package.json
├── README.md
└── src/
    ├── styles.css
    ├── app.js
    ├── state.js
    ├── tuning.js
    ├── chords.js
    ├── audioEngine.js
    ├── visualEngine.js
    ├── ui.js
    ├── i18n.js
    └── seo.js
```

## Run Locally

The site has no required build step.

```bash
npm run dev
```

Then open:

```text
http://localhost:8888
```

You can also open `index.html` directly in a browser, but a local static server is recommended for ES modules.

## Check

```bash
npm run check
```

This runs basic JavaScript syntax validation across the app modules.

## Deploy to Netlify

1. Create a new site in Netlify.
2. Choose this repository.
3. Set build command to blank or leave the value from `netlify.toml`.
4. Set publish directory to `.`.
5. Deploy.

## Connect GitHub to Netlify

1. Push this project to a GitHub repository.
2. In Netlify, select **Add new site** and **Import an existing project**.
3. Connect GitHub and choose the repository.
4. Netlify reads `netlify.toml` automatically.
5. Each push to the selected branch triggers a new deploy.

## Notes

- Primary language: English.
- Secondary language: Spanish via `src/i18n.js`.
- Audio: Web Audio API.
- Visuals: Canvas 2D generative models.
- The visualizations are educational and comparative, not physical measurements or therapeutic claims.
