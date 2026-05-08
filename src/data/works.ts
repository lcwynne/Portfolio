export type Work = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  protected?: boolean;
  featured?: boolean;
};

// Migrated metadata from the existing Webflow site.
// Content is intentionally minimal — the case study pages are placeholders
// to be rewritten with the new data-science / AI-design framing.
export const works: Work[] = [
  {
    slug: 'aidin-copilot',
    title: 'AiDIN Co-Pilot',
    summary: 'Designing an AI assistant that simplifies analytic workflows for non-technical users.',
    tags: ['AI', 'Co-Pilot', 'Enterprise'],
    featured: true,
  },
  {
    slug: 'machine-learning',
    title: 'Machine Learning, no code',
    summary: 'Letting analysts build, evaluate, and deploy models without writing a line of code.',
    tags: ['ML', 'Data Science', 'No-code'],
    featured: true,
  },
  {
    slug: 'multi-product-experience',
    title: 'Multi-Product Experience',
    summary: 'Unifying a cloud suite of analytic products into one coherent experience.',
    tags: ['Design System', 'Cross-product'],
    featured: true,
  },
  {
    slug: 'app-builder',
    title: 'App Builder',
    summary: 'Turning analytic workflows into shareable, branded applications.',
    tags: ['No-code', 'Builder'],
  },
];
