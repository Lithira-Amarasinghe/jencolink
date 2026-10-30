import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';
import { content } from './seed-content.mjs';

if (existsSync(new URL('./.env', import.meta.url))) {
  const raw = readFileSync(new URL('./.env', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    if (!process.env[key]) process.env[key] = match[2].trim();
  }
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim();
const dataset = process.env.SANITY_STUDIO_DATASET?.trim() || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

if (!projectId || !token) {
  console.log(
    'Seed not run. Add SANITY_STUDIO_PROJECT_ID and SANITY_API_WRITE_TOKEN to studio/.env, then run npm run seed again.',
  );
  process.exit(0);
}

const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false });

const documents = [
  { _id: 'hero', _type: 'hero', ...content.hero },
  { _id: 'servicesSection', _type: 'servicesSection', ...content.servicesSection },
  { _id: 'whySection', _type: 'whySection', ...content.whySection },
  { _id: 'faqSection', _type: 'faqSection', ...content.faqSection },
  { _id: 'contactSection', _type: 'contactSection', ...content.contactSection },
  { _id: 'companyDetails', _type: 'companyDetails', ...content.companyDetails },
  ...content.services.map((item, sortOrder) => ({
    _id: `service-${sortOrder}`,
    _type: 'service',
    sortOrder,
    ...item,
  })),
  ...content.products.map((item, sortOrder) => ({
    _id: `product-${sortOrder}`,
    _type: 'product',
    sortOrder,
    ...item,
  })),
  ...content.values.map((item, sortOrder) => ({
    _id: `value-${sortOrder}`,
    _type: 'value',
    sortOrder,
    ...item,
  })),
  ...content.faqs.map((item, sortOrder) => ({
    _id: `faq-${sortOrder}`,
    _type: 'faq',
    sortOrder,
    ...item,
  })),
  ...content.caseStudies.map((item, sortOrder) => ({
    _id: `caseStudy-${sortOrder}`,
    _type: 'caseStudy',
    sortOrder,
    ...item,
    stats: item.stats.map((stat, index) => ({ _key: `stat-${index}`, ...stat })),
  })),
];

const tx = client.transaction();
for (const doc of documents) tx.createOrReplace(doc);
await tx.commit();
console.log(`Seeded ${documents.length} documents into ${projectId}/${dataset}.`);
