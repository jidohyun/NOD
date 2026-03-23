const DEFAULT_HEADLINE_MAX = 88;
const DEFAULT_DESCRIPTION_MAX = 220;

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateWithEllipsis(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= 1) {
    return "…";
  }

  const sliced = value.slice(0, maxLength - 1).trimEnd();
  return `${sliced}…`;
}

export function formatOgHeadline(title: string, maxLength = DEFAULT_HEADLINE_MAX): string {
  return truncateWithEllipsis(collapseWhitespace(title), maxLength);
}

export function formatOgDescription(summary: string, maxLength = DEFAULT_DESCRIPTION_MAX): string {
  return truncateWithEllipsis(collapseWhitespace(summary), maxLength);
}
