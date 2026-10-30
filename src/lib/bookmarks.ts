import { BookmarkNode } from '../types';

export const DEFAULT_BOOKMARKS: BookmarkNode[] = [
  { id: 'bm-1', title: 'Google', url: 'https://www.google.com', dateAdded: Date.now() },
  { id: 'bm-2', title: 'Wikipedia', url: 'https://www.wikipedia.org', dateAdded: Date.now() },
  { id: 'bm-3', title: 'GitHub', url: 'https://github.com', dateAdded: Date.now() },
  { id: 'bm-4', title: 'Hacker News', url: 'https://news.ycombinator.com', dateAdded: Date.now() },
  { id: 'bm-5', title: 'Reddit', url: 'https://www.reddit.com', dateAdded: Date.now() },
];

/**
 * Exports bookmarks array into standard Netscape Bookmark HTML format.
 */
export function exportBookmarksHtml(bookmarks: BookmarkNode[]): string {
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  for (const bm of bookmarks) {
    if (bm.url) {
      html += `    <DT><A HREF="${bm.url}" ADD_DATE="${Math.floor(bm.dateAdded / 1000)}">${bm.title}</A>\n`;
    }
  }

  html += '</DL><p>\n';
  return html;
}

/**
 * Parses Netscape Bookmark HTML into BookmarkNode array.
 */
export function importBookmarksHtml(html: string): BookmarkNode[] {
  const nodes: BookmarkNode[] = [];
  const regex = /<A\s+HREF=["']([^"']+)["'][^>]*>([^<]+)<\/A>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim() || url;
    nodes.push({
      id: 'bm-' + Math.random().toString(36).slice(2, 9),
      title,
      url,
      dateAdded: Date.now(),
    });
  }

  return nodes;
}
