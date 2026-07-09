import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const postSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.date(),
  tags: z.array(z.string()).optional(),
});

const conversations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/conversations' }),
  schema: postSchema,
});

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essays' }),
  schema: postSchema,
});

const seriesSchema = postSchema.extend({
  chapter: z.number(),
});

const structureNotes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/structure-notes' }),
  schema: seriesSchema,
});

export const collections = {
  conversations,
  essays,
  'structure-notes': structureNotes,
};