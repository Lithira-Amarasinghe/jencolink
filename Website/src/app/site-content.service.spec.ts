import { TestBed } from '@angular/core/testing';
import { SiteContentService } from './site-content.service';

describe('SiteContentService', () => {
  let store: SiteContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(SiteContentService);
  });

  it('uses the published company email instead of the built-in address', () => {
    const content = store.fromSanity({
      companyDetails: {
        brandName: 'Gencolink',
        tagline: 'A new tagline',
        email: 'studio@example.com',
        phonePrimary: '+1 555 0100',
        phoneSecondary: '',
        linkedinUrl: 'https://www.linkedin.com/company/jencolink',
      },
    });

    expect(content.companyDetails.email).toBe('studio@example.com');
    expect(content.companyDetails.brandName).toBe('Jencolink');
    expect(content.companyDetails.tagline).toBe('A new tagline');
    expect(content.companyDetails.phonePrimary).toBe('+1 555 0100');
    expect(content.companyDetails.phoneSecondary).toBe('');
    expect(content.companyDetails.linkedinUrl).toBe('https://www.linkedin.com/company/jencolink');
  });

  it('keeps the built-in company details when Sanity has no document', () => {
    const content = store.fromSanity({});

    expect(content.companyDetails.email).toBe('hello@jencolink.com');
    expect(content.companyDetails.phonePrimary).toBe('+94 71 4 280 380');
  });

  it('uses published section copy instead of the built-in heading', () => {
    const content = store.fromSanity({
      contactSection: {
        eyebrow: 'Hello',
        heading: 'Talk to the studio',
        description: 'We reply within a day.',
      },
    });

    expect(content.contactSection.heading).toBe('Talk to the studio');
    expect(content.contactSection.description).toBe('We reply within a day.');
  });
});
