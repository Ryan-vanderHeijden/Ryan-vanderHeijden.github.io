# ryan-vanderheijden.github.io

Personal website of Ryan van der Heijden — postdoctoral researcher at the University of Vermont working on water resources, machine learning, and complex systems science.

Built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Stack

- **Framework**: Astro 6 (static output)
- **Fonts**: Roboto Mono (Google Fonts)
- **Styling**: vanilla CSS with custom themes and palettes
- **Deployment**: GitHub Actions → GitHub Pages

## Structure

```
src/
├── components/
│   ├── Nav.astro           # terminal-style breadcrumb nav
│   └── TerminalFrame.astro # bordered terminal-style content box
├── islands/
│   └── ascii-bg.ts         # animated ASCII background
├── layouts/
│   └── Layout.astro        # shared page shell
├── pages/
│   ├── index.astro
│   ├── about.astro
│   ├── projects.astro
│   └── blog/index.astro
└── styles/
    ├── global.css
    └── palettes.css        # color themes
```

## Themes

Five color palettes, toggleable via the dots in the top-right corner. Preference is saved to `localStorage`.

| Name       | Vibe        |
|------------|-------------|
| RV Default | pink/purple |
| Graham     | orange/gold |
| Shoyu      | warm brown  |
| Synthwave  | pink/red    |
| Dark       | blue/gray   |

## Development

```bash
npm install
npm run dev      # localhost:4321
npm run build    # output to ./dist
npm run preview  # preview the build
```

## Deployment

Pushes to `main` automatically deploy via `.github/workflows/deploy.yml`.
In the repo settings, ensure **Pages → Source** is set to **GitHub Actions**.
