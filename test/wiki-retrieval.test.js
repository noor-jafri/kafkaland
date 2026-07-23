import test from 'node:test';
import assert from 'node:assert/strict';
import { answerCompanion } from '../server/answer-service.js';
import { DeterministicProvider } from '../server/provider.js';
import { loadWikiCorpus, retrieveWiki } from '../server/wiki-corpus.js';
import { WIKI_ACCESS } from '../server/wiki-access.js';

const corpus = await loadWikiCorpus();
const startProgress = { currentLevel: 1, flags: ['arrival_complete'] };
const housingProgress = { currentLevel: 1, flags: ['arrival_complete', 'housing_complete'] };
const levelTwoProgress = { currentLevel: 2, flags: ['arrival_complete', 'housing_complete', 'level_1_complete'] };

test('tracked Markdown is split deterministically with complete progression metadata', () => {
  assert.ok(corpus.length > 250);
  assert.equal(new Set(corpus.map((section) => section.sourcePath)).size, 23);
  assert.deepEqual([...new Set(corpus.map((section) => section.sourcePath))], Object.keys(WIKI_ACCESS).map((name) => `wiki/${name}`));
  for (const section of corpus) {
    assert.match(section.sourcePath, /^wiki\/\d{2}-.+\.md$/);
    assert.ok(section.pageTitle);
    assert.ok(section.heading);
    assert.equal(section.language, 'en');
    assert.ok(Number.isInteger(section.minLevel));
    assert.equal('requiredFlags' in section, false);
    assert.ok(section.text.length > 0);
  }
});

test('lexical ranking favors the relevant unlocked heading', () => {
  const arrival = retrieveWiki(corpus, 'Which documents should I prepare before arriving?', startProgress);
  assert.equal(arrival.kind, 'supported');
  assert.equal(arrival.sources[0].sourcePath, 'wiki/01-before-you-arrive.md');
  assert.match(arrival.sources[0].heading, /Documents\/Requirements checklist/i);

  const bank = retrieveWiki(corpus, 'How do I open a bank account?', levelTwoProgress);
  assert.equal(bank.kind, 'supported');
  assert.equal(bank.sources[0].sourcePath, 'wiki/05-bank-account.md');
  assert.equal(bank.sources[0].heading, 'Step-by-step process');
});

test('progress filtering locks future pages before any source is returned', () => {
  const locked = retrieveWiki(corpus, 'How do I open a bank account?', startProgress);
  assert.equal(locked.kind, 'locked');
  assert.deepEqual(locked.sources, []);
  assert.doesNotMatch(locked.hint, /account|bank/i);

  const anmeldung = retrieveWiki(corpus, 'Was brauche ich für die Anmeldung?', housingProgress);
  assert.equal(anmeldung.kind, 'supported');
  assert.equal(anmeldung.locale, 'de');
  assert.ok(anmeldung.sources.some((source) => source.sourcePath === 'wiki/04-city-registration-anmeldung.md'));
  assert.ok(anmeldung.sources.every((source) => source.minLevel <= 1));
});

test('standing glossary remains available while unrelated questions are refused', () => {
  const glossary = retrieveWiki(corpus, 'What is a Niederlassungserlaubnis?', startProgress);
  assert.equal(glossary.kind, 'supported');
  assert.equal(glossary.sources[0].sourcePath, 'wiki/23-glossary-and-resources.md');

  const unrelated = retrieveWiki(corpus, 'Explain quantum chromodynamics', startProgress);
  assert.equal(unrelated.kind, 'unsupported');
  assert.deepEqual(unrelated.sources, []);
});

test('locked questions never invoke the language model', async () => {
  const provider = new DeterministicProvider();
  const result = await answerCompanion({
    mode: 'ask',
    input: 'How do I open a German bank account?',
    progress: startProgress,
    corpus,
    provider,
  });
  assert.equal(result.type, 'locked');
  assert.equal(result.citations.length, 0);
  assert.equal(provider.callCount, 0);
});

test('grounded answer citations expose only allowed file and heading metadata', async () => {
  const provider = new DeterministicProvider();
  const result = await answerCompanion({
    mode: 'ask',
    input: 'Which documents should I prepare before arriving?',
    progress: startProgress,
    corpus,
    provider,
  });
  assert.equal(result.type, 'answer');
  assert.equal(result.citations[0].path, 'wiki/01-before-you-arrive.md');
  assert.match(result.answer, /\[S1\]/);
  assert.equal('text' in result.citations[0], false);
  assert.ok(result.citations.every((citation) => citation.path === 'wiki/01-before-you-arrive.md' || WIKI_ACCESS[citation.path.slice(5)].minLevel <= 1));
});

test('citation validation rejects a provider that invents a locked source ID', async () => {
  const provider = {
    async answer() {
      return { answer: 'A made-up claim [S99]', citations: ['S99'] };
    },
  };
  await assert.rejects(
    answerCompanion({
      mode: 'ask',
      input: 'Which documents should I prepare before arriving?',
      progress: startProgress,
      corpus,
      provider,
    }),
    { code: 'INVALID_MODEL_RESPONSE' },
  );
});
