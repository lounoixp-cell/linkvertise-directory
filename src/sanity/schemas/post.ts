import { defineType, defineField } from 'sanity';

export const postSchema = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Primary name/title of the post',
      validation: (Rule) => Rule.required().min(1).max(200),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input) =>
          input
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, ''),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tag',
      title: 'Tag (Optional)',
      type: 'string',
      description: 'Optional internal tag/note',
      validation: (Rule) => Rule.max(50),
    }),
    defineField({
      name: 'previewImage',
      title: 'Preview Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          description: 'Required for accessibility and SEO',
          validation: (Rule) => Rule.required().warning('Alt text is recommended for SEO and screen readers'),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'externalUrl',
      title: 'External Destination URL',
      type: 'url',
      description: 'Safe destination URL opened only from individual post page',
      validation: (Rule) =>
        Rule.required().uri({
          scheme: ['http', 'https'],
          allowRelative: false,
        }),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Publication Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active / Published', value: 'active' },
          { title: 'Archived', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'active',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Deterministic integer sequence (1, 2, 3...). Lower numbers appear first.',
      initialValue: 100,
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: 'description',
      title: 'Description (Optional)',
      type: 'text',
      rows: 3,
      description: 'Optional summary for post detail view and SEO meta tags',
    }),
  ],
  orderings: [
    {
      title: 'Deterministic Order (sortOrder asc, date desc)',
      name: 'deterministicOrder',
      by: [
        { field: 'sortOrder', direction: 'asc' },
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      tag: 'tag',
      media: 'previewImage',
      sortOrder: 'sortOrder',
    },
    prepare({ title, tag, media, sortOrder }) {
      return {
        title: title || 'Untitled',
        subtitle: `[#${sortOrder ?? '?'}] ${tag || 'No Tag'}`,
        media,
      };
    },
  },
});

export default postSchema;
