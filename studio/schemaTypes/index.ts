import { defineArrayMember, defineField, defineType } from 'sanity';

const serviceIcons = ['code', 'workflow', 'data', 'cloud', 'globe', 'shield'];
const productIcons = ['workflow', 'data', 'lock', 'globe'];

const sortOrder = defineField({
  name: 'sortOrder',
  title: 'Order',
  type: 'number',
  validation: (rule) => rule.required().integer().min(0),
});

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    sortOrder,
    defineField({
      name: 'icon',
      type: 'string',
      options: { list: serviceIcons },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: 'items',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
  orderings: [{ title: 'Order', name: 'sortOrder', by: [{ field: 'sortOrder', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'body' } },
});

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    sortOrder,
    defineField({
      name: 'icon',
      type: 'string',
      options: { list: productIcons },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 3, validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: 'title', subtitle: 'body' } },
});

export const value = defineType({
  name: 'value',
  title: 'Value',
  type: 'document',
  fields: [
    sortOrder,
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 3, validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: 'title', subtitle: 'body' } },
});

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    sortOrder,
    defineField({ name: 'question', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'answer', type: 'text', rows: 4, validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: 'question', subtitle: 'answer' } },
});

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case study',
  type: 'document',
  fields: [
    sortOrder,
    defineField({ name: 'industry', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'image', title: 'Image path', type: 'string' }),
    defineField({ name: 'summary', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: 'stats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'value', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
          ],
        }),
      ],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'industry' } },
});

const eyebrow = defineField({ name: 'eyebrow', type: 'string', validation: (rule) => rule.required() });
const heading = defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() });
const description = defineField({
  name: 'description',
  type: 'text',
  rows: 4,
  validation: (rule) => rule.required(),
});

export const hero = defineType({
  name: 'hero',
  title: 'Hero',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'titleHighlight', type: 'string', validation: (rule) => rule.required() }),
    description,
    defineField({ name: 'primaryCta', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'secondaryCta', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'proofPoints',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
});

export const servicesSection = defineType({
  name: 'servicesSection',
  title: 'Services section',
  type: 'document',
  fields: [eyebrow, heading, description],
});

export const whySection = defineType({
  name: 'whySection',
  title: 'Why section',
  type: 'document',
  fields: [eyebrow, heading, description],
});

export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ section',
  type: 'document',
  fields: [eyebrow, heading],
});

export const contactSection = defineType({
  name: 'contactSection',
  title: 'Contact section',
  type: 'document',
  fields: [eyebrow, heading, description],
});

export const companyDetails = defineType({
  name: 'companyDetails',
  title: 'Company details',
  type: 'document',
  fields: [
    defineField({ name: 'brandName', type: 'string', initialValue: 'Jencolink', readOnly: true }),
    defineField({ name: 'tagline', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'email', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'phonePrimary', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'phoneSecondary', type: 'string' }),
    defineField({ name: 'linkedinUrl', type: 'string' }),
    defineField({ name: 'githubUrl', type: 'string' }),
    defineField({ name: 'facebookUrl', type: 'string' }),
    defineField({ name: 'instagramUrl', type: 'string' }),
    defineField({ name: 'tiktokUrl', type: 'string' }),
  ],
});

export const schemaTypes = [
  service,
  product,
  value,
  faq,
  caseStudy,
  hero,
  servicesSection,
  whySection,
  faqSection,
  contactSection,
  companyDetails,
];
