const ALLOWED_TAGS = new Set([
  "a",
  "article",
  "aside",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const DROP_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "template",
  "link",
  "meta",
  "base",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "svg",
  "math",
]);

const ALLOWED_ATTRS = new Set([
  "alt",
  "aria-label",
  "aria-hidden",
  "colspan",
  "href",
  "rel",
  "rowspan",
  "src",
  "target",
  "title",
]);

export function sanitizeHtml(html: string) {
  if (!html.trim()) {
    return "";
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  for (const child of Array.from(document.body.childNodes)) {
    sanitizeNode(child);
  }

  return document.body.innerHTML;
}

export function extractFirstImageUrl(html: string | null | undefined) {
  if (!html?.trim()) {
    return null;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const image = document.querySelector("img");
  const src = image?.getAttribute("src");

  return isSafeUrl(src, false) ? src ?? null : null;
}

function sanitizeNode(node: Node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (DROP_TAGS.has(tagName)) {
      element.remove();
      return;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      unwrapElement(element);
      return;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();

      if (name.startsWith("on") || name === "style") {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (!ALLOWED_ATTRS.has(name)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === "a") {
      const href = element.getAttribute("href");

      if (!isSafeUrl(href, true)) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer nofollow");
      }
    }

    if (tagName === "img") {
      const src = element.getAttribute("src");

      if (!isSafeUrl(src, false)) {
        element.remove();
        return;
      }

      element.setAttribute("loading", "lazy");
      if (!element.getAttribute("alt")) {
        element.setAttribute("alt", "");
      }
    }
  }

  for (const child of Array.from(node.childNodes)) {
    sanitizeNode(child);
  }
}

function unwrapElement(element: HTMLElement) {
  const parent = element.parentNode;

  if (!parent) {
    element.remove();
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  element.remove();
}

function isSafeUrl(value: string | null | undefined, allowMailTo: boolean) {
  if (!value) {
    return false;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  if (trimmedValue.startsWith("#")) {
    return true;
  }

  try {
    const url = new URL(trimmedValue, window.location.href);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return true;
    }

    if (allowMailTo && url.protocol === "mailto:") {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
