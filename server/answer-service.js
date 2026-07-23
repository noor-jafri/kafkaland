import { isPageUnlocked } from './wiki-access.js';
import { detectLocale, retrieveWiki, tokenize } from './wiki-corpus.js';
import {
  classifyLocally,
  detectDeterministicFutureLeak,
  isUrgentSafetyText,
  needsScopeVerifier,
  publicLevelTaxonomy,
  requiresGeneralGuidance,
} from './level-taxonomy.js';
import { ProviderError } from './provider.js';

const MAX_SOURCE_CHARS = 4_000;
const GENERAL_LABEL = /^(?:General guidance \(not from the Kafkaland wiki\):|Allgemeine Hinweise \(nicht aus dem Kafkaland-Wiki\):)/;

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
      throw new ProviderError('A future-level source crossed the retrieval boundary', 'LOCKED_SOURCE_BOUNDARY');
    }
  }
}

function validateCitationIds(output, sources, mode) {
  if (!Array.isArray(output.citations)) throw new ProviderError('Model citations are missing', 'INVALID_MODEL_RESPONSE');
  if (!['wiki', 'wiki_and_general', 'general'].includes(output.sourceBasis)) {
    throw new ProviderError('Model source basis is invalid', 'INVALID_MODEL_RESPONSE');
  }
  const allowedIds = new Set(sources.map((source) => source.id));
  const citations = [...new Set(output.citations)];
  if (citations.length !== output.citations.length || citations.length > sources.length) {
    throw new ProviderError('Model citations are invalid', 'INVALID_MODEL_RESPONSE');
  }
  for (const id of citations) {
    if (typeof id !== 'string' || !allowedIds.has(id) || !output.answer.includes(`[${id}]`)) {
      throw new ProviderError('Model cited an unavailable source', 'INVALID_MODEL_RESPONSE');
    }
  }
  const markers = [...output.answer.matchAll(/\[(S\d+)\]/g)].map((match) => match[1]);
  if (markers.some((marker) => !allowedIds.has(marker) || !citations.includes(marker))) {
    throw new ProviderError('Model used an unavailable inline citation', 'INVALID_MODEL_RESPONSE');
  }
  if (output.sourceBasis === 'general' && citations.length) {
    throw new ProviderError('General guidance cannot claim wiki citations', 'INVALID_MODEL_RESPONSE');
  }
  if (output.sourceBasis !== 'general' && citations.length === 0) {
    throw new ProviderError('Wiki-based output requires a citation', 'INVALID_MODEL_RESPONSE');
  }
  if (mode === 'ask') {
    const paragraphs = output.answer.split(/\n+/).map((part) => part.trim()).filter(Boolean);
    if (paragraphs.some((paragraph) => !/\[S\d+\]/.test(paragraph) && !GENERAL_LABEL.test(paragraph))) {
      throw new ProviderError('Uncited guidance must be clearly labelled', 'INVALID_MODEL_RESPONSE');
    }
    if (output.sourceBasis.includes('general') && !paragraphs.some((paragraph) => GENERAL_LABEL.test(paragraph))) {
      throw new ProviderError('General guidance label is missing', 'INVALID_MODEL_RESPONSE');
    }
  }
  return citations;
}

function validateItems(items, letterText, field) {
  if (!Array.isArray(items) || items.length > 8) throw new ProviderError(`Model ${field} are invalid`, 'INVALID_MODEL_RESPONSE');
  return items.map((item) => {
    if (
      typeof item?.text !== 'string' || !item.text.trim() || item.text.length > 500 ||
      typeof item?.evidenceQuote !== 'string' || !item.evidenceQuote.trim() || item.evidenceQuote.length > 700 ||
      !letterText.includes(item.evidenceQuote)
    ) throw new ProviderError(`Model ${field} lack exact letter evidence`, 'INVALID_MODEL_RESPONSE');
    return { text: item.text.trim(), evidenceQuote: item.evidenceQuote };
  });
}

function validateProviderOutput(output, { mode, sources, input }) {
  if (typeof output?.answer !== 'string' || !output.answer.trim() || output.answer.length > 6_000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(output.answer)) {
    throw new ProviderError('Model answer is invalid', 'INVALID_MODEL_RESPONSE');
  }
  const normalized = { answer: output.answer.trim(), sourceBasis: output.sourceBasis };
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
    return { id, path: source.sourcePath, title: source.pageTitle, heading: source.heading, language: source.language };
  });
}

function lockedResult(locale, currentLevel, urgent = false) {
  const safety = urgent
    ? localized(locale, ' For immediate danger, contact the appropriate official emergency authority.', ' Bei unmittelbarer Gefahr wende dich an die zuständige offizielle Notfallstelle.')
    : '';
  return {
    type: 'locked',
    locale,
    answer: localized(
      locale,
      `That guidance belongs to a later chapter. Unlock the next required level first.${safety}`,
      `Diese Hilfe gehört zu einem späteren Kapitel. Schalte zuerst das benötigte Level frei.${safety}`,
    ),
    citations: [],
    generalGuidance: false,
  };
}

function warningFor(locale) {
  return localized(
    locale,
    'Not legal advice. Rules, fees, offices, and deadlines can change. Confirm urgent or high-stakes details with the issuing authority or a current official source.',
    'Keine Rechtsberatung. Regeln, Gebühren, Ämter und Fristen können sich ändern. Bestätige dringende oder wichtige Angaben bei der ausstellenden Behörde oder in einer aktuellen offiziellen Quelle.',
  );
}

async function classifyInput(input, provider, signal) {
  const local = classifyLocally(input);
  if (local.confident) return { ...local, inScope: true, usedFallback: false };
  if (typeof provider.classify !== 'function') return { inScope: false, requiredLevel: null, highStakes: false, usedFallback: false };
  const fallback = await provider.classify({ input, taxonomy: publicLevelTaxonomy(), signal });
  if (
    typeof fallback?.inScope !== 'boolean' || typeof fallback?.highStakes !== 'boolean' ||
    (fallback.inScope && (!Number.isInteger(fallback.requiredLevel) || fallback.requiredLevel < 1 || fallback.requiredLevel > 5)) ||
    (!fallback.inScope && fallback.requiredLevel !== null)
  ) throw new ProviderError('OpenAI level classification was invalid', 'INVALID_MODEL_RESPONSE');
  return { ...fallback, usedFallback: true, topicIds: [] };
}

export async function answerCompanion({ mode, input, progress, corpus, provider, signal }) {
  const locale = detectLocale(input);
  const classification = await classifyInput(input, provider, signal);
  if (!classification.inScope) {
    return {
      type: 'unsupported',
      locale,
      answer: localized(locale, 'I can only help with Kafkaland relocation topics.', 'Ich kann nur bei Kafkaland-Themen rund um den Umzug helfen.'),
      citations: [],
      generalGuidance: false,
    };
  }
  if (classification.requiredLevel > progress.currentLevel) {
    return lockedResult(locale, progress.currentLevel, mode === 'letter' && isUrgentSafetyText(input));
  }

  const retrieval = retrieveWiki(corpus, input, progress, { locale });
  const retrievedSources = retrieval.kind === 'supported' ? retrieval.sources : [];
  assertAllowedSources(retrievedSources, progress);
  const lostPassport = requiresGeneralGuidance(input);
  const sourcePool = lostPassport
    ? retrievedSources.filter((source) => /passport|reisepass/i.test(`${source.heading}\n${source.text}`))
    : retrievedSources;
  const providerSources = sourcePool.map((source) => ({ ...source, text: selectExcerpt(source.text, input) }));
  const allowGeneralGuidance = retrieval.kind !== 'supported' || lostPassport;
  const output = await provider.answer({
    mode,
    input,
    locale,
    sources: providerSources,
    allowGeneralGuidance,
    highStakes: Boolean(classification.highStakes),
    signal,
  });
  assertAllowedSources(providerSources, progress);
  const validated = validateProviderOutput(output, { mode, sources: providerSources, input });

  const allowedSourceText = providerSources.map((source) => source.text).join('\n');
  const leaks = detectDeterministicFutureLeak(validated.answer, progress.currentLevel, allowedSourceText);
  if (leaks.length) return lockedResult(locale, progress.currentLevel, mode === 'letter' && isUrgentSafetyText(input));
  if (needsScopeVerifier(validated.answer, progress.currentLevel) && typeof provider.verifyScope === 'function') {
    const verification = await provider.verifyScope({
      answer: validated.answer,
      currentLevel: progress.currentLevel,
      taxonomy: publicLevelTaxonomy(),
      signal,
    });
    if (typeof verification?.allowed !== 'boolean' || !Array.isArray(verification.leakingLevels) || !verification.allowed) {
      return lockedResult(locale, progress.currentLevel, mode === 'letter' && isUrgentSafetyText(input));
    }
  }

  const highStakes = mode === 'letter' || classification.highStakes || validated.sourceBasis.includes('general');
  return {
    type: mode === 'letter' ? 'letter' : 'answer',
    locale,
    answer: validated.answer,
    deadlines: validated.deadlines,
    actions: validated.actions,
    citations: citationMetadata(validated.citations, providerSources),
    generalGuidance: validated.sourceBasis.includes('general'),
    ...(highStakes ? { warning: warningFor(locale) } : {}),
  };
}
