import { isPageUnlocked } from './wiki-access.js';
import { detectLocale, retrieveWiki, tokenize } from './wiki-corpus.js';
import { ProviderError } from './provider.js';

const MAX_SOURCE_CHARS = 4_000;

function localized(locale, english, german) {
  return locale === 'de' ? german : english;
}

function selectExcerpt(text, query) {
  if (text.length <= MAX_SOURCE_CHARS) return text;
  const queryTokens = new Set(tokenize(query));
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const ranked = paragraphs.map((paragraph, index) => ({
    paragraph,
    index,
    score: tokenize(paragraph).filter((term) => queryTokens.has(term)).length,
  })).sort((a, b) => b.score - a.score || a.index - b.index);
  const chosen = [];
  let length = 0;
  for (const candidate of ranked) {
    if (chosen.length && length + candidate.paragraph.length > MAX_SOURCE_CHARS) continue;
    chosen.push(candidate);
    length += candidate.paragraph.length + 2;
    if (length >= MAX_SOURCE_CHARS * 0.75) break;
  }
  return chosen.sort((a, b) => a.index - b.index).map((candidate) => candidate.paragraph).join('\n\n').slice(0, MAX_SOURCE_CHARS);
}

function assertAllowedSources(sources, progress) {
  for (const source of sources) {
    if (!isPageUnlocked(source, progress)) {
      throw new ProviderError('A locked source crossed the retrieval boundary', 'LOCKED_SOURCE_BOUNDARY');
    }
  }
}

function validateCitationIds(output, sources, mode) {
  if (!Array.isArray(output.citations)) throw new ProviderError('Model citations are missing', 'INVALID_MODEL_RESPONSE');
  const allowedIds = new Set(sources.map((source) => source.id));
  const citations = [...new Set(output.citations)];
  if (citations.length !== output.citations.length || citations.length > sources.length) {
    throw new ProviderError('Model citations are invalid', 'INVALID_MODEL_RESPONSE');
  }
  for (const id of citations) {
    if (typeof id !== 'string' || !allowedIds.has(id)) {
      throw new ProviderError('Model cited an unavailable source', 'INVALID_MODEL_RESPONSE');
    }
    if (!output.answer.includes(`[${id}]`)) {
      throw new ProviderError('Model omitted an inline source marker', 'INVALID_MODEL_RESPONSE');
    }
  }
  if (mode === 'ask' && citations.length === 0) {
    throw new ProviderError('A grounded answer requires a citation', 'INVALID_MODEL_RESPONSE');
  }
  const markers = [...output.answer.matchAll(/\[(S\d+)\]/g)].map((match) => match[1]);
  if (markers.some((marker) => !allowedIds.has(marker) || !citations.includes(marker))) {
    throw new ProviderError('Model used an unavailable inline citation', 'INVALID_MODEL_RESPONSE');
  }
  if (mode === 'ask') {
    const factualParagraphs = output.answer.split(/\n+/).map((part) => part.trim()).filter(Boolean);
    if (factualParagraphs.some((paragraph) => !/\[S\d+\]/.test(paragraph))) {
      throw new ProviderError('Every answer paragraph must be grounded', 'INVALID_MODEL_RESPONSE');
    }
  }
  return citations;
}

function validateItems(items, letterText, field) {
  if (!Array.isArray(items) || items.length > 8) {
    throw new ProviderError(`Model ${field} are invalid`, 'INVALID_MODEL_RESPONSE');
  }
  return items.map((item) => {
    if (
      typeof item?.text !== 'string' || !item.text.trim() || item.text.length > 500 ||
      typeof item?.evidenceQuote !== 'string' || !item.evidenceQuote.trim() || item.evidenceQuote.length > 700 ||
      !letterText.includes(item.evidenceQuote)
    ) {
      throw new ProviderError(`Model ${field} lack exact letter evidence`, 'INVALID_MODEL_RESPONSE');
    }
    return { text: item.text.trim(), evidenceQuote: item.evidenceQuote };
  });
}

function validateProviderOutput(output, { mode, sources, input }) {
  if (typeof output?.answer !== 'string' || !output.answer.trim() || output.answer.length > 6_000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(output.answer)) {
    throw new ProviderError('Model answer is invalid', 'INVALID_MODEL_RESPONSE');
  }
  const normalized = { answer: output.answer.trim() };
  normalized.citations = validateCitationIds(output, sources, mode);
  if (mode === 'letter') {
    normalized.deadlines = validateItems(output.deadlines ?? [], input, 'deadlines');
    normalized.actions = validateItems(output.actions ?? [], input, 'actions');
  }
  return normalized;
}

function citationMetadata(citationIds, sources) {
  const byId = new Map(sources.map((source) => [source.id, source]));
  return citationIds.map((id) => {
    const source = byId.get(id);
    return {
      id,
      path: source.sourcePath,
      title: source.pageTitle,
      heading: source.heading,
      language: source.language,
    };
  });
}

export async function answerCompanion({ mode, input, progress, corpus, provider, signal }) {
  const locale = detectLocale(input);
  const retrieval = retrieveWiki(corpus, input, progress, { locale });

  if (mode === 'ask' && retrieval.kind === 'locked') {
    return {
      type: 'locked',
      locale,
      answer: localized(
        locale,
        `That file is still sealed by a future checkpoint. ${retrieval.hint}`,
        `Diese Akte ist noch durch einen späteren Kontrollpunkt gesperrt. ${retrieval.hint}`,
      ),
      citations: [],
    };
  }
  if (mode === 'ask' && retrieval.kind === 'unsupported') {
    return {
      type: 'unsupported',
      locale,
      answer: localized(
        locale,
        'I cannot find an unlocked Kafkaland source that supports an answer. Try asking about your arrival, housing, or a term in the glossary.',
        'Ich finde keine freigeschaltete Kafkaland-Quelle, die eine Antwort belegt. Frag nach deiner Ankunft, Wohnung oder einem Begriff aus dem Glossar.',
      ),
      citations: [],
    };
  }

  const retrievedSources = retrieval.kind === 'supported' ? retrieval.sources : [];
  assertAllowedSources(retrievedSources, progress);
  const providerSources = retrievedSources.map((source) => ({
    ...source,
    text: selectExcerpt(source.text, input),
  }));
  const output = await provider.answer({ mode, input, locale, sources: providerSources, signal });
  assertAllowedSources(providerSources, progress);
  const validated = validateProviderOutput(output, { mode, sources: providerSources, input });

  return {
    type: mode === 'letter' ? 'letter' : 'answer',
    locale,
    answer: validated.answer,
    deadlines: validated.deadlines,
    actions: validated.actions,
    citations: citationMetadata(validated.citations, providerSources),
    ...(mode === 'letter' ? {
      warning: localized(
        locale,
        'Not legal advice. Rules, fees, offices, and deadlines can change. Confirm urgent or high-stakes details with the issuing authority or an official current source.',
        'Keine Rechtsberatung. Regeln, Gebühren, Ämter und Fristen können sich ändern. Bestätige dringende oder wichtige Angaben bei der ausstellenden Behörde oder in einer aktuellen offiziellen Quelle.',
      ),
    } : {}),
  };
}
