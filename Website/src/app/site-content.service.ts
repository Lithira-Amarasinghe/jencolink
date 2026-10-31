import { Injectable, computed, signal } from '@angular/core';

export type HeroContent = {
  title: string;
  titleHighlight: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  proofPoints: string[];
};

export type ServiceContent = {
  icon: 'code' | 'workflow' | 'data' | 'cloud' | 'globe' | 'shield';
  title: string;
  body: string;
  items: string[];
};

export type ProductContent = {
  icon: 'workflow' | 'data' | 'lock' | 'globe';
  title: string;
  body: string;
};

export type CaseStudyContent = {
  industry: string;
  title: string;
  image: string;
  summary: string;
  stats: { value: string; label: string }[];
};

export type ValueContent = {
  title: string;
  body: string;
};

export type FaqContent = {
  question: string;
  answer: string;
};

export type WhySectionContent = {
  eyebrow: string;
  heading: string;
  description: string;
};

export type FaqSectionContent = {
  eyebrow: string;
  heading: string;
};

export type ServicesSectionContent = {
  eyebrow: string;
  heading: string;
  description: string;
};

export type ContactSectionContent = {
  eyebrow: string;
  heading: string;
  description: string;
};

export type CompanyDetailsContent = {
  brandName: string;
  tagline: string;
  email: string;
  phonePrimary: string;
  phoneSecondary: string;
  linkedinUrl: string;
  githubUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
};

export type SiteContent = {
  hero: HeroContent;
  services: ServiceContent[];
  products: ProductContent[];
  caseStudies: CaseStudyContent[];
  values: ValueContent[];
  faqs: FaqContent[];
  whySection: WhySectionContent;
  faqSection: FaqSectionContent;
  servicesSection: ServicesSectionContent;
  contactSection: ContactSectionContent;
  companyDetails: CompanyDetailsContent;
};

const defaultContent: SiteContent = {
  hero: {
    title: 'Building software that powers a',
    titleHighlight: 'better tomorrow',
    description:
      'We design, build, and scale intelligent software solutions that drive innovation, create value, and shape the future.',
    primaryCta: 'Explore Solutions',
    secondaryCta: 'Watch Demo',
    proofPoints: ['Strategy-led delivery', 'Cloud-ready architecture', 'Fast iterations'],
  },
  services: [
    {
      icon: 'code',
      title: 'Web Design and Development',
      body: 'Professional websites, landing pages, custom web apps, and ongoing maintenance.',
      items: [
        'Personal Portfolio Websites',
        'Corporate and Company Websites',
        'Landing Pages',
        'Custom Web Applications',
        'Website Maintenance',
      ],
    },
    {
      icon: 'workflow',
      title: 'eCommerce Solutions',
      body: 'Online stores and commerce operations with payments, inventory, and marketplace support.',
      items: [
        'Online Store Development',
        'Payment Gateway Integration',
        'Order Management Systems',
        'Inventory Management',
        'Multi-Vendor Platforms',
      ],
    },
    {
      icon: 'workflow',
      title: 'Business Process Automation',
      body: 'Automation tools that reduce manual work and make approvals, CRM, and reporting easier.',
      items: [
        'Workflow Automation',
        'CRM Solutions',
        'Approval Systems',
        'Reporting Dashboards',
        'Custom Automation Tools',
      ],
    },
    {
      icon: 'data',
      title: 'Retail Management Systems',
      body: 'Retail platforms for point of sale, stock control, purchasing, and branch operations.',
      items: [
        'POS Systems',
        'Inventory Management',
        'Sales and Purchase Tracking',
        'Customer Management',
        'Multi-Branch Management',
      ],
    },
    {
      icon: 'data',
      title: 'Restaurant Management Systems',
      body: 'Restaurant operations software for POS, reservations, orders, billing, and kitchen workflows.',
      items: [
        'Restaurant POS Systems',
        'Table Reservation Systems',
        'Order and Billing Management',
        'Kitchen Display Systems',
        'Menu and Inventory Management',
      ],
    },
    {
      icon: 'cloud',
      title: 'Supply Chain Management Solutions',
      body: 'Supply chain tools for suppliers, warehouses, procurement, and connected operations.',
      items: ['Supplier Management', 'Warehouse Management', 'Procurement Management'],
    },
    {
      icon: 'globe',
      title: 'Hotel and Tourism Solutions',
      body: 'Digital systems for hotels, travel agencies, bookings, tour packages, and guest handling.',
      items: [
        'Hotel Management Systems',
        'Booking and Reservation Platforms',
        'Travel Agency Software',
        'Tour Package Management',
        'Guest Management Systems',
      ],
    },
    {
      icon: 'shield',
      title: 'Healthcare and Fitness Solutions',
      body: 'Clinic, pharmacy, appointment, patient record, and gym management systems.',
      items: [
        'Clinic Management Systems',
        'Appointment Scheduling',
        'Patient Record Management',
        'Pharmacy Management',
        'Gym Management Systems',
      ],
    },
    {
      icon: 'cloud',
      title: 'Education Technology Solutions',
      body: 'Learning and school management platforms for institutions, exams, and e-learning.',
      items: [
        'Learning Management Systems',
        'School Management Systems',
        'Student Information Systems',
        'Online Examination Systems',
        'E-Learning Platforms',
      ],
    },
    {
      icon: 'code',
      title: 'Custom Software Development',
      body: 'Tailor-made software, SaaS products, APIs, and enterprise-grade web or mobile applications.',
      items: [
        'Tailor-Made Business Applications',
        'SaaS Product Development',
        'Web and Mobile Applications',
        'API Development and Integration',
        'Enterprise Software Solutions',
      ],
    },
  ],
  products: [
    {
      icon: 'workflow',
      title: 'LinkOps',
      body: 'Platform for observability, alerts, and incident management.',
    },
    {
      icon: 'data',
      title: 'DataLink',
      body: 'Data integration and pipelines for modern analytics.',
    },
    {
      icon: 'lock',
      title: 'AuthLink',
      body: 'Secure authentication and user management made simple.',
    },
    {
      icon: 'globe',
      title: 'FlowLink',
      body: 'Workflow automation for operations and approvals.',
    },
  ],
  caseStudies: [
    {
      industry: 'Fintech',
      title: 'Payrix Mobile Platform',
      image: '/assets/case-fintech.png',
      summary: 'Modern mobile banking platform with seamless payments and real-time insights.',
      stats: [
        { value: '40%', label: 'Increase in activation' },
        { value: '99.99%', label: 'Uptime achieved' },
      ],
    },
    {
      industry: 'Logistics',
      title: 'Movu Operations Hub',
      image: '/assets/case-logistics.png',
      summary: 'Unified operations platform streamlining fleets, routes, and driver communication.',
      stats: [
        { value: '28%', label: 'Improvement in efficiency' },
        { value: '23%', label: 'Reduction in ops cost' },
      ],
    },
    {
      industry: 'Healthcare',
      title: 'Healthia Patient Portal',
      image: '/assets/case-healthcare.png',
      summary: 'Patient engagement platform with scheduling, telehealth, and secure messaging.',
      stats: [
        { value: '35%', label: 'Increase in engagement' },
        { value: '50%', label: 'Reduction in admin time' },
      ],
    },
  ],
  values: [
    {
      title: 'Tailored Solutions',
      body: 'Every business is different. We take the time to understand your requirements and build solutions that align with your goals, processes, and future growth.',
    },
    {
      title: 'Quality Engineering',
      body: 'We follow modern development practices to create software that is secure, maintainable, and built with long-term reliability in mind.',
    },
    {
      title: 'Built to Scale',
      body: 'Our solutions are designed with flexibility and scalability, making it easier to adapt and grow as your business evolves.',
    },
    {
      title: 'Transparent Collaboration',
      body: 'We believe great results come from working together. Throughout every stage of the project, we keep communication open, provide regular updates, and value your feedback.',
    },
    {
      title: 'Ongoing Support',
      body: "Our commitment doesn't end at launch. We provide maintenance, improvements, and technical support to help keep your software running smoothly.",
    },
  ],
  faqs: [
    {
      question: 'Do you work with startups and small businesses?',
      answer:
        'Yes. We enjoy working with startups, entrepreneurs, and growing businesses to transform ideas into practical digital solutions.',
    },
    {
      question: 'Can you build software tailored to our business?',
      answer:
        'Absolutely. Every solution we build is designed around your unique requirements, workflows, and business objectives.',
    },
    {
      question: 'Do you provide website maintenance and support?',
      answer:
        'Yes. We offer ongoing maintenance, security updates, performance improvements, and technical support for websites and web applications.',
    },
    {
      question: 'Can you improve an existing application or website?',
      answer:
        'Yes. We can enhance existing systems by adding new features, improving performance, modernizing the user experience, or resolving technical issues.',
    },
    {
      question: 'What happens after the project is completed?',
      answer:
        "We're happy to continue supporting your software with maintenance, enhancements, and technical guidance whenever you need us.",
    },
  ],
  whySection: {
    eyebrow: 'Why Choose Jencolink',
    heading: 'A reliable partner for building modern software',
    description:
      'At Jencolink, we believe successful software is built on clear communication, thoughtful engineering, and a genuine understanding of your goals. We focus on delivering practical, scalable solutions while building long-term relationships based on trust and collaboration.',
  },
  faqSection: {
    eyebrow: 'Frequently Asked Questions',
    heading: 'Everything you might want to know',
  },
  servicesSection: {
    eyebrow: 'Our Services',
    heading: 'End-to-end engineering for modern businesses',
    description:
      'From strategy to scale, we help you build, integrate, and operate software that drives impact.',
  },
  contactSection: {
    eyebrow: "Let's Connect",
    heading: "Let's build something great together",
    description:
      "Whether you're starting a new project, exploring an idea, or looking to improve an existing system, we'd love to hear from you. Share your goals with us, and we'll get back to you within one business day.",
  },
  companyDetails: {
    brandName: 'Jencolink',
    tagline: 'Building software that supports growth, innovation, and lasting value.',
    email: 'hello@gencolink.com',
    phonePrimary: '+94 71 4 280 380',
    phoneSecondary: '+94 77 5 690 380',
    linkedinUrl: 'https://www.linkedin.com',
    githubUrl: 'https://github.com',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
  },
};

/**
 * The public name is Jencolink. Older stored copy may still say Gencolink.
 */
function publicBrand(value: string): string {
  return value.replaceAll('Gencolink', 'Jencolink');
}

type SanityConfig = {
  __SANITY_PROJECT_ID__?: string;
  __SANITY_DATASET__?: string;
  __APP_ENV__?: string;
};

const CONTENT_QUERY = `{
  "services": *[_type == "service"] | order(sortOrder asc) { icon, title, body, items },
  "products": *[_type == "product"] | order(sortOrder asc) { icon, title, body },
  "values": *[_type == "value"] | order(sortOrder asc) { title, body },
  "faqs": *[_type == "faq"] | order(sortOrder asc) { question, answer },
  "caseStudies": *[_type == "caseStudy"] | order(sortOrder asc) {
    industry, title, image, summary, stats[]{ value, label }
  },
  "hero": *[_id == "hero"][0]{ title, titleHighlight, description, primaryCta, secondaryCta, proofPoints },
  "whySection": *[_id == "whySection"][0]{ eyebrow, heading, description },
  "faqSection": *[_id == "faqSection"][0]{ eyebrow, heading },
  "servicesSection": *[_id == "servicesSection"][0]{ eyebrow, heading, description },
  "contactSection": *[_id == "contactSection"][0]{ eyebrow, heading, description },
  "companyDetails": *[_id == "companyDetails"][0]{
    brandName, tagline, email, phonePrimary, phoneSecondary,
    linkedinUrl, githubUrl, facebookUrl, instagramUrl, tiktokUrl
  }
}`;

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  readonly content = signal<SiteContent>(defaultContent);
  /**
   * True until the CMS fetch settles (success or failure). Lets the template
   * show skeleton placeholders instead of flashing the hardcoded fallback
   * copy at users while the real content is still in flight.
   */
  readonly loading = signal(true);
  readonly hero = computed(() => this.content().hero);
  readonly services = computed(() => this.content().services);
  readonly products = computed(() => this.content().products);
  readonly caseStudies = computed(() => this.content().caseStudies);
  readonly values = computed(() => this.content().values);
  readonly faqs = computed(() => this.content().faqs);
  readonly whySection = computed(() => this.content().whySection);
  readonly faqSection = computed(() => this.content().faqSection);
  readonly servicesSection = computed(() => this.content().servicesSection);
  readonly contactSection = computed(() => this.content().contactSection);
  readonly companyDetails = computed(() => this.content().companyDetails);

  private requestId = 0;
  private watchingEdits = false;

  async load(): Promise<void> {
    const requestId = ++this.requestId;
    const projectId = this.projectId();
    if (!projectId) {
      this.loading.set(false);
      if (this.localPreview()) {
        console.warn(
          'Sanity project id is empty, so the page is showing the built-in copy. Set window.__SANITY_PROJECT_ID__ in Website/public/runtime-config.js to the same id as studio/.env.',
        );
      }
      return;
    }

    this.watchForPublishedEdits();

    try {
      const dataset = (globalThis as SanityConfig).__SANITY_DATASET__?.trim() || 'production';
      const query = encodeURIComponent(CONTENT_QUERY);
      // The dev server proxies /sanity-api so the browser is not blocked by
      // Sanity's CORS check. The project id travels in a header because the
      // proxy rewrites the path before it chooses the Sanity host.
      // Production reads the cached public API directly.
      const url = this.localPreview()
        ? `/sanity-api/v2025-01-01/data/query/${dataset}?query=${query}`
        : `https://${projectId}.apicdn.sanity.io/v2025-01-01/data/query/${dataset}?query=${query}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(this.localPreview() ? { 'X-Sanity-Project': projectId } : {}),
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        throw new Error(`CMS fetch failed (${response.status}) ${detail}`);
      }
      if (requestId !== this.requestId) return;

      const body = (await response.json()) as { result?: Record<string, unknown> };
      const result = body.result ?? {};
      this.content.set(this.fromSanity(result));
    } catch (error) {
      if (requestId !== this.requestId) return;
      if (this.localPreview()) {
        console.warn(
          'Sanity content was not applied. The page is showing the built-in copy.',
          error,
        );
      }
    } finally {
      if (requestId === this.requestId) this.loading.set(false);
    }
  }

  private localPreview(): boolean {
    return (globalThis as SanityConfig).__APP_ENV__ !== 'production';
  }

  private watchForPublishedEdits(): void {
    if (this.watchingEdits || !this.localPreview() || typeof document === 'undefined') return;
    this.watchingEdits = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void this.load();
    });
  }

  private projectId(): string | null {
    const id = (globalThis as SanityConfig).__SANITY_PROJECT_ID__?.trim();
    return id ? id : null;
  }

  private fromSanity(result: Record<string, unknown>): SiteContent {
    const services = this.list<ServiceContent>(result['services'], (row) => ({
      icon: row['icon'] as ServiceContent['icon'],
      title: String(row['title'] ?? ''),
      body: String(row['body'] ?? ''),
      items: strings(row['items']),
    }));
    const products = this.list<ProductContent>(result['products'], (row) => ({
      icon: row['icon'] as ProductContent['icon'],
      title: String(row['title'] ?? ''),
      body: String(row['body'] ?? ''),
    }));
    const values = this.list<ValueContent>(result['values'], (row) => ({
      title: String(row['title'] ?? ''),
      body: String(row['body'] ?? ''),
    }));
    const faqs = this.list<FaqContent>(result['faqs'], (row) => ({
      question: String(row['question'] ?? ''),
      answer: String(row['answer'] ?? ''),
    }));
    const caseStudies = this.list<CaseStudyContent>(result['caseStudies'], (row) => ({
      industry: String(row['industry'] ?? ''),
      title: String(row['title'] ?? ''),
      image: String(row['image'] ?? ''),
      summary: String(row['summary'] ?? ''),
      stats: Array.isArray(row['stats'])
        ? row['stats'].map((stat) => {
            const item = stat as Record<string, unknown>;
            return { value: String(item['value'] ?? ''), label: String(item['label'] ?? '') };
          })
        : [],
    }));

    return {
      hero: this.section(result['hero'], defaultContent.hero, (row) => ({
        title: String(row['title']),
        titleHighlight: String(row['titleHighlight']),
        description: String(row['description']),
        primaryCta: String(row['primaryCta']),
        secondaryCta: String(row['secondaryCta']),
        proofPoints: strings(row['proofPoints']),
      })),
      services: services.length ? services : defaultContent.services,
      products: products.length ? products : defaultContent.products,
      caseStudies: caseStudies.length ? caseStudies : defaultContent.caseStudies,
      values: values.length ? values : defaultContent.values,
      faqs: faqs.length ? faqs : defaultContent.faqs,
      whySection: this.section(result['whySection'], defaultContent.whySection, (row) => ({
        eyebrow: publicBrand(String(row['eyebrow'] ?? '')),
        heading: String(row['heading']),
        description: publicBrand(String(row['description'] ?? '')),
      })),
      faqSection: this.section(result['faqSection'], defaultContent.faqSection, (row) => ({
        eyebrow: String(row['eyebrow'] ?? ''),
        heading: String(row['heading']),
      })),
      servicesSection: this.section(
        result['servicesSection'],
        defaultContent.servicesSection,
        (row) => ({
          eyebrow: String(row['eyebrow'] ?? ''),
          heading: String(row['heading']),
          description: String(row['description'] ?? ''),
        }),
      ),
      contactSection: this.section(
        result['contactSection'],
        defaultContent.contactSection,
        (row) => ({
          eyebrow: String(row['eyebrow'] ?? ''),
          heading: String(row['heading']),
          description: String(row['description'] ?? ''),
        }),
      ),
      companyDetails: this.section(
        result['companyDetails'],
        defaultContent.companyDetails,
        (row) => ({
          brandName: 'Jencolink',
          tagline: String(row['tagline'] ?? ''),
          email: String(row['email'] ?? ''),
          phonePrimary: String(row['phonePrimary'] ?? ''),
          phoneSecondary: String(row['phoneSecondary'] ?? ''),
          linkedinUrl: String(row['linkedinUrl'] ?? ''),
          githubUrl: String(row['githubUrl'] ?? ''),
          facebookUrl: String(row['facebookUrl'] ?? ''),
          instagramUrl: String(row['instagramUrl'] ?? ''),
          tiktokUrl: String(row['tiktokUrl'] ?? ''),
        }),
      ),
    };
  }

  private list<T>(value: unknown, map: (row: Record<string, unknown>) => T): T[] {
    if (!Array.isArray(value)) return [];
    return value.map((row) => map(row as Record<string, unknown>));
  }

  private section<T>(value: unknown, fallback: T, map: (row: Record<string, unknown>) => T): T {
    if (!value || typeof value !== 'object') return fallback;
    const row = value as Record<string, unknown>;
    const present = ['heading', 'title', 'brandName', 'email'].some((key) => Boolean(row[key]));
    return present ? map(row) : fallback;
  }
}
