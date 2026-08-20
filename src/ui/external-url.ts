/**
 * The one href policy: only http(s) may become an anchor. Applied to every
 * link path — raw markdown hrefs, docId-resolved registry urls — so a crafted
 * `javascript:`/`data:` value degrades to literal text instead of a clickable
 * anchor, no matter which seam it arrives through.
 */
export function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
