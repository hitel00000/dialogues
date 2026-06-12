import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const conversations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/conversations' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
  }),
});

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essays' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  conversations,
  essays,
};