import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'aaaaaaaa',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  studioHost: 'jencolink',
});
