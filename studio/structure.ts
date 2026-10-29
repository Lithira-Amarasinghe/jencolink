import type { StructureResolver } from 'sanity/structure';

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem()
    .title(title)
    .id(type)
    .child(S.document().schemaType(type).documentId(type));

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Jencolink')
    .items([
      S.documentTypeListItem('service').title('Services'),
      S.documentTypeListItem('product').title('Products'),
      S.documentTypeListItem('value').title('Values'),
      S.documentTypeListItem('faq').title('FAQs'),
      S.documentTypeListItem('caseStudy').title('Case studies'),
      S.divider(),
      singleton(S, 'hero', 'Hero'),
      singleton(S, 'servicesSection', 'Services section'),
      singleton(S, 'whySection', 'Why section'),
      singleton(S, 'faqSection', 'FAQ section'),
      singleton(S, 'contactSection', 'Contact section'),
      singleton(S, 'companyDetails', 'Company details'),
    ]);
