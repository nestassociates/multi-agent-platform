/**
 * Sitemap.xml Generator
 * Dynamically generates sitemap from agent data
 */

export async function GET() {
  // In production, this will read from generated agent data
  // For now, generate basic sitemap with known pages
  const pages = [
    '',
    'about',
    'services',
    'properties',
    'blog',
    'areas',
    'reviews',
    'contact',
  ];

  const baseUrl = 'https://agent-subdomain.agents.nestassociates.com';

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}/${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
