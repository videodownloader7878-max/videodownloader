import sanitizeHtml from "sanitize-html";
// All CMS HTML (pages, posts) passes through this before rendering. Scripts, event handlers and unsafe URLs are removed.
export const clean = (html: string) => sanitizeHtml(html, {
  allowedTags: ["h1","h2","h3","h4","h5","h6","p","br","hr","strong","b","em","i","u","ul","ol","li","a","img","blockquote","table","thead","tbody","tr","th","td","code","pre","details","summary","figure","figcaption"],
  allowedAttributes: { a: ["href", "title"], img: ["src", "alt", "title", "width", "height"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"] },
  allowedSchemes: ["https", "http", "mailto"], allowedSchemesByTag: { img: ["https"] }, allowProtocolRelative: false,
  transformTags: { a: (tag, attribs) => ({ tagName: "a", attribs: { ...attribs, rel: "noopener noreferrer" } }) },
});
