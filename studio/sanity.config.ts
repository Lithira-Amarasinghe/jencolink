import { defineConfig, defineSingleton } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';
import { structure } from './structure';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'aaaaaaaa';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

const singletonIds = [
  'hero',
  'servicesSection',
  'whySection',
  'faqSection',
  'contactSection',
  'companyDetails',
];

export default defineConfig({
  name: 'default',
  title: 'Jencolink',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
  document: {
    singletons: singletonIds.map((id) => defineSingleton({ documentId: id, schemaType: id })),
  },
});
