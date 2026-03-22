export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

const FEEDS = [
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
  { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph' },
];

function extractTag(xml: string, tag: string): string {
  const cdataRegex = new RegExp(
    `<${tag}><\\!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`,
    's',
  );
  const plainRegex = new RegExp(`<${tag}>(.*?)<\\/${tag}>`, 's');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = xml.match(plainRegex);
  if (plainMatch) return plainMatch[1].trim();
  return '';
}

function extractLink(itemXml: string): string {
  // Try plain <link> first (text node), falling back to href attribute
  const plainRegex = /<link>(.*?)<\/link>/s;
  const match = itemXml.match(plainRegex);
  if (match && match[1].trim().startsWith('http')) {
    return match[1].trim();
  }
  // Try atom:link or link with href
  const hrefRegex = /<(?:atom:)?link[^>]+href="([^"]+)"/;
  const hrefMatch = itemXml.match(hrefRegex);
  if (hrefMatch) return hrefMatch[1].trim();
  return '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function toIso(pubDate: string): string {
  if (!pubDate) return new Date(0).toISOString();
  try {
    return new Date(pubDate).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

async function parseFeed(url: string, source: string): Promise<NewsItem[]> {
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status} ${url}`);
  const xml = await res.text();

  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/g;
  const items: NewsItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleRaw = extractTag(itemXml, 'title');
    const title = stripHtml(titleRaw);
    if (!title) continue;

    const link = extractLink(itemXml);
    if (!link) continue;

    const pubDateRaw = extractTag(itemXml, 'pubDate');
    const pubDate = toIso(pubDateRaw);

    const descRaw = extractTag(itemXml, 'description');
    const description = stripHtml(descRaw).slice(0, 200);

    items.push({ title, link, pubDate, source, description });
  }

  return items;
}

export async function getCryptoNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map((feed) => parseFeed(feed.url, feed.source)),
  );

  const allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }

  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return allItems.slice(0, 20);
}
