import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://16.192.15.202.sslip.io';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/features',
          '/features/',
          '/compare',
          '/compare/',
          '/case-studies',
          '/case-studies/',
          '/research',
          '/research/',
          '/reviews',
          '/faq',
          '/directories',
          '/expenses/split-bill',
          '/privacy',
          '/terms',
          '/llms.txt',
          '/llms-full.txt',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/groups/',
          '/settlements/',
          '/settings/',
          '/admin/',
          '/notifications/',
          '/reports/',
          '/activity/',
          '/fairscore/',
          '/budgets/',
          '/recurring/',
          '/currency/',
        ],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'PerplexityBot',
          'Google-Extended',
          'Applebot-Extended',
          'cohere-ai',
          'OAI-SearchBot',
          'Meta-ExternalAgent',
        ],
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
