import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One markdown file per piece. The body is the longer caption shown on the piece's page;
// it can grow into a full data-and-methods write-up later.
const gallery = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/gallery' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // 'scrolly' pieces link straight to their standalone page in public/scrolly/
      kind: z.enum(['image', 'scrolly']).default('image'),
      href: z.string().optional(),
      series: z.enum(['flow-regimes', 'drought', 'rain', 'experiments']),
      order: z.number(),
      // made by `npm run import-images` from the render named in `original`
      image: image(),
      original: z.string(),
      alt: z.string(),
      summary: z.string(),
      source: z.string(),
      note: z.string().optional(),
    }),
});

// Write-ups of research software whose repositories are private. The body is the write-up;
// `facts` is the row of numbers at the top of the page.
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string(),
      order: z.number(),
      summary: z.string(),
      stack: z.string(),
      facts: z.array(z.object({ value: z.string(), label: z.string() })),
      // either a picture or one of the drawn diagrams in src/components/diagrams
      image: image().optional(),
      diagram: z.enum(['dual-graph']).optional(),
      alt: z.string(),
      caption: z.string(),
    }),
});

export const collections = { gallery, projects };
