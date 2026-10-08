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

export const collections = { gallery };
