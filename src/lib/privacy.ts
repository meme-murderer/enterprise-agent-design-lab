const sensitivePatterns = [
  {
    label: "email address",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  { label: "Social Security number", pattern: /\b\d{3}-?\d{2}-?\d{4}\b/ },
  { label: "payment card number", pattern: /\b(?:\d[ -]*?){13,19}\b/ },
  {
    label: "credential or secret",
    pattern: /\b(?:api[_ -]?key|password|secret|token)\s*[:=]\s*\S+/i,
  },
];

export function detectSensitiveContent(values: string[]) {
  for (const value of values) {
    for (const candidate of sensitivePatterns) {
      if (candidate.pattern.test(value)) return candidate.label;
    }
  }
  return null;
}

export const privacyMessage =
  "Please remove specific or sensitive details and answer with generalized or hypothetical information.";
