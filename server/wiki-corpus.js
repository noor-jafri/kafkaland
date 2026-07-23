import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { WIKI_ACCESS, isPageUnlocked, progressionHint } from './wiki-access.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'explain', 'for', 'from', 'how', 'i', 'in', 'is',
  'it', 'me', 'my', 'of', 'on', 'or', 'tell', 'the', 'this', 'to', 'what', 'when', 'where', 'which', 'with', 'you',
  'aber', 'als', 'am', 'an', 'auf', 'bei', 'bin', 'das', 'der', 'die', 'ein', 'eine', 'erklaren', 'fur', 'ich',
  'im', 'in', 'ist', 'kann', 'mein', 'mit', 'oder', 'und', 'von', 'was', 'wie', 'wo', 'zu',
]);

const TERM_GROUPS = [
  ['anmeldung', 'anmelden', 'wohnort', 'adresse', 'registration', 'register', 'bürgeramt', 'buergeramt', 'meldebescheinigung'],
  ['reisepass', 'reisepasses', 'passport', 'pass'],
  ['wohnung', 'wohnen', 'miete', 'mietvertrag', 'accommodation', 'housing', 'rent', 'landlord', 'vermieter'],
  ['bank', 'bankkonto', 'konto', 'girokonto', 'iban', 'account'],
  ['versicherung', 'krankenversicherung', 'gesundheit', 'health', 'insurance', 'gkv', 'pkv'],
  ['steuer', 'steuern', 'steuerid', 'tax', 'taxes', 'finanzamt'],
  ['aufenthalt', 'aufenthaltstitel', 'ausländerbehörde', 'auslaenderbehoerde', 'residence', 'permit', 'immigration'],
  ['frist', 'deadline', 'termin', 'appointment'],
  ['führerschein', 'fuehrerschein', 'driving', 'license', 'licence'],
  ['rundfunkbeitrag', 'radio', 'broadcasting', 'gez'],
];

function cleanHeading(value) {
  return value.replace(/\s+#+\s*$/, '').trim();
}

function rawTokens(value) {
  const normalized = String(value)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('de-DE')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}]+/gu, ' ');
  return normalized.split(/\s+/).filter((token) => token.length > 1 && !/^\d+$/.test(token) && !STOP_WORDS.has(token));
}

export function tokenize(value) {
  const tokens = rawTokens(value);
  const expanded = new Set(tokens);
  for (const group of TERM_GROUPS) {
    const normalizedGroup = group.map((term) => tokenizeBase(term));
    if (normalizedGroup.some((term) => expanded.has(term))) {
      for (const term of normalizedGroup) expanded.add(term);
    }
  }
  return [...expanded];
}

function tokenizeBase(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('de-DE')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function splitMarkdown(markdown, filename) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let pageTitle = filename;
  let current = null;
  const rawSections = [];

  function pushCurrent() {
    if (!current) return;
    const body = current.lines.join('\n').trim().replace(/\n---\n[\s\S]*$/, '').trim();
    if (body) rawSections.push({ heading: current.heading, body, depth: current.depth });
  }

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (match) {
      const depth = match[1].length;
      const heading = cleanHeading(match[2]);
      if (depth === 1) {
        pageTitle = heading;
        if (!current) current = { heading: 'Page overview', depth: 1, lines: [] };
        continue;
      }
      pushCurrent();
      current = { heading, depth, lines: [] };
    } else {
      if (!current) current = { heading: 'Page overview', depth: 1, lines: [] };
      current.lines.push(line);
    }
  }
  pushCurrent();
  return { pageTitle, rawSections };
}

export async function loadWikiCorpus({ wikiDirectory = path.resolve('wiki') } = {}) {
  const filenames = (await readdir(wikiDirectory))
    .filter((name) => /^\d{2}-.+\.md$/.test(name))
    .sort((a, b) => a.localeCompare(b, 'en'));

  const mapped = Object.keys(WIKI_ACCESS).sort((a, b) => a.localeCompare(b, 'en'));
  if (JSON.stringify(filenames) !== JSON.stringify(mapped)) {
    const missing = filenames.filter((name) => !WIKI_ACCESS[name]);
    const stale = mapped.filter((name) => !filenames.includes(name));
    throw new Error(`Wiki access mapping mismatch (unmapped: ${missing.join(', ') || 'none'}; missing files: ${stale.join(', ') || 'none'})`);
  }

  const sections = [];
  for (const filename of filenames) {
    const markdown = await readFile(path.join(wikiDirectory, filename), 'utf8');
    const { pageTitle, rawSections } = splitMarkdown(markdown, filename);
    const access = WIKI_ACCESS[filename];
    for (const [sectionIndex, section] of rawSections.entries()) {
      const sourcePath = `wiki/${filename}`;
      sections.push(Object.freeze({
        key: `${filename}#${sectionIndex + 1}`,
        sourcePath,
        pageTitle,
        heading: section.heading,
        headingDepth: section.depth,
        language: 'en',
        minLevel: access.minLevel,
        standingReference: Boolean(access.standingReference),
        text: section.body,
        titleTokens: tokenize(pageTitle),
        headingTokens: tokenize(section.heading),
        bodyTokens: tokenize(section.body),
      }));
    }
  }
  return Object.freeze(sections);
}

function count(tokens, term) {
  let total = 0;
  for (const token of tokens) if (token === term) total++;
  return total;
}

function rank(sections, queryTokens, { metadataOnly = false, originalTokens = queryTokens } = {}) {
  if (!queryTokens.length || !sections.length) return [];
  const lengthFor = (section) => metadataOnly
    ? section.titleTokens.length + section.headingTokens.length
    : section.bodyTokens.length;
  const includesTerm = (section, term) => (
    section.titleTokens.includes(term) || section.headingTokens.includes(term) || (!metadataOnly && section.bodyTokens.includes(term))
  );
  const averageLength = sections.reduce((sum, section) => sum + lengthFor(section), 0) / sections.length || 1;
  const original = new Set(originalTokens);
  const documentFrequency = new Map();
  for (const term of queryTokens) {
    documentFrequency.set(term, sections.filter((section) => includesTerm(section, term)).length);
  }

  return sections.map((section) => {
    let score = 0;
    for (const term of queryTokens) {
      const frequency = metadataOnly ? 0 : count(section.bodyTokens, term);
      const titleFrequency = count(section.titleTokens, term);
      const headingFrequency = count(section.headingTokens, term);
      if (!frequency && !titleFrequency && !headingFrequency) continue;
      const df = documentFrequency.get(term) || 0;
      const idf = Math.log(1 + (sections.length - df + 0.5) / (df + 0.5));
      const lengthRatio = lengthFor(section) / averageLength;
      const normalizedBody = frequency
        ? (frequency * 2.2) / (frequency + 1.2 * (0.25 + 0.75 * lengthRatio))
        : 0;
      const metadataBoost = Math.min(1, titleFrequency) * 2.8 + Math.min(1, headingFrequency) * 3.8;
      score += idf * (normalizedBody + metadataBoost) * (original.has(term) ? 2.4 : 0.12);
    }
    if (/^sources$/i.test(section.heading)) score *= 0.18;
    return { section, score };
  }).filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.section.key.localeCompare(b.section.key, 'en'));
}

function applyIntentBoost(results, query, originalTokens) {
  const asksForChecklist = /\b(document|documents|requirements?|checklist|unterlagen|brauche|benotige|benötige)\b/i.test(query);
  const asksForProcess = /\b(how|open|apply|process|steps?|wie|eroffnen|eröffnen|beantragen)\b/i.test(query);
  for (const result of results) {
    const { section } = result;
    const titleMatches = originalTokens.filter((term) => section.titleTokens.includes(term)).length;
    const headingMatches = originalTokens.filter((term) => section.headingTokens.includes(term)).length;
    result.score += titleMatches * 10 + headingMatches * 6;
    if (asksForChecklist && /documents|requirements|checklist/i.test(section.heading)) result.score += 12;
    if (asksForProcess && /step-by-step|process|overview/i.test(section.heading)) result.score += 10;
  }
  return results.sort((a, b) => b.score - a.score || a.section.key.localeCompare(b.section.key, 'en'));
}

export function detectLocale(value) {
  const text = ` ${String(value).toLocaleLowerCase('de-DE')} `;
  const germanSignals = [' der ', ' die ', ' das ', ' und ', ' ich ', ' muss ', ' brauche ', ' bitte ', ' was ', ' wie ', ' wann ', ' anmeldung', 'frist', ' dringend', ' gefahr'];
  return germanSignals.filter((signal) => text.includes(signal)).length >= 2 ? 'de' : 'en';
}

export function retrieveWiki(corpus, query, progress, { limit = 4, locale = detectLocale(query) } = {}) {
  const originalTokens = rawTokens(query);
  const queryTokens = tokenize(query);
  const allowed = [];
  const locked = [];
  for (const section of corpus) {
    const metadata = {
      minLevel: section.minLevel,
      standingReference: section.standingReference,
    };
    (isPageUnlocked(metadata, progress) ? allowed : locked).push(section);
  }

  const allowedResults = applyIntentBoost(rank(allowed, queryTokens, { originalTokens }), query, originalTokens);
  // Locked content is never considered as answer evidence. Server-side page
  // titles and headings only identify questions that belong beyond the gate.
  const lockedResults = rank(locked, queryTokens, { metadataOnly: true, originalTokens });
  const bestAllowed = allowedResults[0]?.score || 0;
  const bestLocked = lockedResults[0]?.score || 0;
  const allowedMetadataMatch = allowedResults[0] && queryTokens.some((term) => (
    allowedResults[0].section.titleTokens.includes(term) || allowedResults[0].section.headingTokens.includes(term)
  ));
  const definitionQuestion = /^\s*(what(?:'s| is)|define|was ist|was bedeutet|bedeutet)\b/i.test(query);
  const glossaryDefinition = allowedResults[0]?.section.standingReference && definitionQuestion;
  const lockedDominates = bestLocked >= 1.25 && bestLocked > bestAllowed * 1.35 && !allowedMetadataMatch && !glossaryDefinition;

  if (lockedDominates || (bestAllowed < 0.45 && bestLocked >= 0.8)) {
    const lockedSection = lockedResults[0].section;
    return {
      kind: 'locked',
      locale,
      hint: progressionHint(lockedSection, progress, locale),
      sources: [],
    };
  }

  if (bestAllowed < 0.45) return { kind: 'unsupported', locale, sources: [] };

  return {
    kind: 'supported',
    locale,
    sources: allowedResults.slice(0, limit).map(({ section, score }, index) => ({
      id: `S${index + 1}`,
      sourcePath: section.sourcePath,
      pageTitle: section.pageTitle,
      heading: section.heading,
      language: section.language,
      minLevel: section.minLevel,
      text: section.text,
      score,
    })),
  };
}
