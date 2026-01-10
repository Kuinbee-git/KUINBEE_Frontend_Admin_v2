/**
 * Site Configuration
 * Global site metadata and settings
 */

export const siteConfig = {
  name: 'Kuinbee Admin Panel',
  description: 'Internal control plane for marketplace administrators',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.png',
  links: {
    github: 'https://github.com/kuinbee',
    docs: 'https://docs.kuinbee.com',
  },
} as const;
