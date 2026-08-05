// Central brand + site configuration. Edit these values to rebrand the site.
export const BRAND = {
  name: 'be',
  tagline: 'Be Different',
  // Navigation
  instagramUrl: 'https://www.instagram.com/beva.tht?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  // Hero copy (home)
  hero: {
    headline: 'BE DIFFERENT',
    subheadline: 'Limited preorder. Only 100 pieces will ever be available.',
    primaryCta: 'Preorder Now',
    secondaryNote: 'Estimated shipping after production.',
  },
  // "Why Preorder" cards
  whyPreorder: [
    {
      title: 'Limited Collection',
      body: 'A fixed run of 100 pieces. Once they are reserved, no more will be made.',
    },
    {
      title: 'Premium Materials',
      body: 'Selected fabrics and finishes, cut and assembled to a luxury standard.',
    },
    {
      title: 'Made Only For Those Who Reserve',
      body: 'Each piece is produced to order for the person who claimed it — nothing surplus.',
    },
  ],
} as const;

export const SITE = {
  defaultSeoTitle: 'be — Limited Preorder',
  defaultSeoDescription: 'be. A limited preorder collection. Only 100 pieces will ever be available.',
} as const;
