export type EmailTemplateLinkIssue = {
  label: string;
  href: string;
  reason: string;
};

export type EmailTemplateSegment =
  | { kind: "text"; value: string }
  | { kind: "link"; label: string; href: string };

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const MARKDOWN_LINK_PATTERN = /\[([^\]\n]{1,160})\]\(([^)\s]{1,200})\)/g;

export function validateEmailHyperlink(value: string) {
  const href = value.trim();
  if (!href) return { valid: false, normalized: "", reason: "Enter a link destination." };
  if (/^[a-z][a-z\d+.-]*:/i.test(href) && !/^(?:https?|mailto|tel):/i.test(href)) {
    return { valid: false, normalized: href, reason: "Only http, https, mailto, and tel links are allowed." };
  }
  try {
    const parsed = new URL(href, "https://smart-manager.invalid");
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return { valid: false, normalized: href, reason: "Only http, https, mailto, and tel links are allowed." };
    }
    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.hostname) {
      return { valid: false, normalized: href, reason: "Enter a complete web address, such as https://example.com." };
    }
    if ((parsed.protocol === "mailto:" || parsed.protocol === "tel:") && !parsed.pathname) {
      return { valid: false, normalized: href, reason: "Enter a recipient or telephone number after the link protocol." };
    }
    return { valid: true, normalized: href, reason: "" };
  } catch {
    return { valid: false, normalized: href, reason: "Enter a valid link destination." };
  }
}

export function findEmailTemplateLinkIssues(value: string): EmailTemplateLinkIssue[] {
  const issues: EmailTemplateLinkIssue[] = [];
  for (const match of Array.from(value.matchAll(MARKDOWN_LINK_PATTERN))) {
    const label = match[1].trim();
    const href = match[2].trim();
    const result = validateEmailHyperlink(href);
    if (!result.valid) issues.push({ label, href, reason: result.reason });
  }
  return issues;
}

export function hasInvalidEmailTemplateLinks(value: string) {
  return findEmailTemplateLinkIssues(value).length > 0;
}

export function buildSafeEmailTemplateSegments(value: string): EmailTemplateSegment[] {
  const segments: EmailTemplateSegment[] = [];
  let cursor = 0;
  for (const match of Array.from(value.matchAll(MARKDOWN_LINK_PATTERN))) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ kind: "text", value: value.slice(cursor, start) });
    const label = match[1].trim();
    const href = match[2].trim();
    const result = validateEmailHyperlink(href);
    if (result.valid) segments.push({ kind: "link", label, href: result.normalized });
    else segments.push({ kind: "text", value: label });
    cursor = start + match[0].length;
  }
  if (cursor < value.length) segments.push({ kind: "text", value: value.slice(cursor) });
  return segments.length ? segments : [{ kind: "text", value }];
}

export function buildEmailTemplateHtml(value: string) {
  return buildSafeEmailTemplateSegments(value)
    .map((segment) => segment.kind === "link"
      ? `<a href="${escapeEmailHtml(segment.href)}" rel="noopener noreferrer">${escapeEmailHtml(segment.label)}</a>`
      : escapeEmailHtml(segment.value))
    .join("")
    .replace(/\n/g, "<br />");
}

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
}
