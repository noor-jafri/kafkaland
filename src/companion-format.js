export function submissionSummary(mode, input) {
  return mode === 'letter' ? 'German letter submitted for a private explanation' : input.trim();
}

export function citationLabel(citation) {
  return `${citation.title} · ${citation.heading}`;
}

export function inputLimitFor(mode) {
  return mode === 'letter' ? 12_000 : 1_000;
}
