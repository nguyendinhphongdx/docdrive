import sanitize from "sanitize-html";

const ALLOWED_TAGS = [
  ...sanitize.defaults.allowedTags,
  "img",
  "h1",
  "h2",
  "figure",
  "figcaption",
  "picture",
  "source",
  "details",
  "summary",
  "del",
  "ins",
  "mark",
];

const ALLOWED_ATTRIBUTES: sanitize.IOptions["allowedAttributes"] = {
  ...sanitize.defaults.allowedAttributes,
  "*": ["class", "id", "title"],
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  source: ["src", "srcset", "type", "media"],
  code: ["class"],
  pre: ["class"],
};

export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    transformTags: {
      a: sanitize.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
    disallowedTagsMode: "discard",
  });
}
