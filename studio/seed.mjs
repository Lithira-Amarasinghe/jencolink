import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { content } from './seed-content.mjs';

const studioDir = dirname(fileURLToPath(import.meta.url));

function decodeEnv(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer.subarray(2));
    for (let i = 0; i + 1 < swapped.length; i += 2) {
      const left = swapped[i];
      swapped[i] = swapped[i + 1];
      swapped[i + 1] = left;
    }
    return swapped.toString('utf16le');
  }
  const text = buffer.toString('utf8');
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return false;
  const raw = decodeEnv(readFileSync(filePath));
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
  return true;
}

const envPath = join(studioDir, '.env');
const envTxtPath = join(studioDir, '.env.txt');
const envFile = loadEnvFile(envPath) ? envPath : loadEnvFile(envTxtPath) ? envTxtPath : '';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim();
const dataset = process.env.SANITY_STUDIO_DATASET?.trim() || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

if (!projectId || !token) {
  const missing = [
    !projectId ? 'SANITY_STUDIO_PROJECT_ID' : '',
    !token ? 'SANITY_API_WRITE_TOKEN' : '',
  ].filter(Boolean);
  const where = envFile
    ? `Read ${envFile}, but these values are empty: ${missing.join(', ')}.`
    : 'Could not find studio/.env. If Notepad saved it, the file may be named .env.txt.';
  console.log(`Seed not run. ${where}`);
  process.exit(1);
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
