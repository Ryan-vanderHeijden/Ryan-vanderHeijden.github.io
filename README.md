# ryan-vanderheijden.github.io

A gallery of data images and scroll stories, plus an about page. Built with
[Astro](https://astro.build) and deployed to GitHub Pages by `.github/workflows/deploy.yml`
on every push to `main`.

## Adding a picture

1. Add `src/content/gallery/<slug>.md`. Copy an existing entry: `original` names the render
   in `~/projects/backgrounds/out`, and `image` points at `../../assets/gallery/<slug>.webp`.
   The markdown body is the caption on the picture's own page.
2. `npm run import-images` makes the 2560 px web master (about 0.3 MB) from the 4K render.
   Set `RENDERS=/path` for a different source folder, and pass `-- --force` to redo one.
3. `npm run dev` and check http://localhost:4321.

Sections and their order are in `src/series.ts`.

## Scroll stories

Standalone pages live in `public/scrolly/<slug>/` and are served as they are. Add a gallery
entry with `kind: scrolly` and `href: /scrolly/<slug>/`; it takes the hero slot on the home page.
`river-calendars` is a copy of `~/projects/backgrounds/scrolly/` (`index.html` and `data.js`),
so copy it again after changing it there.

## Development

```sh
npm install
npm run dev       # localhost:4321
npm run build     # to ./dist
npm run preview
```
