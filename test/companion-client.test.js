import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { citationLabel, inputLimitFor, submissionSummary } from '../src/companion-format.js';
import { COMPANIONS, MAP } from '../src/levels/level1.js';
import viteConfig from '../vite.config.js';

test('letter submission summary never retains pasted letter text', () => {
  const privateText = 'Meine private Aktennummer 12345';
  const summary = submissionSummary('letter', privateText);
  assert.equal(summary, 'German letter submitted for a private explanation');
  assert.doesNotMatch(summary, /12345|Aktennummer/);
  assert.equal(inputLimitFor('letter'), 12_000);
  assert.equal(inputLimitFor('ask'), 1_000);
});

test('citations have readable title and heading labels', () => {
  assert.equal(citationLabel({ title: 'City Registration', heading: 'Documents checklist' }), 'City Registration · Documents checklist');
});

test('companion kiosk is a discoverable world NPC rather than a menu shortcut', () => {
  assert.equal(COMPANIONS.K.id, 'companion');
  assert.equal(COMPANIONS.K.name, 'Marlene, Amts-Eule');
  assert.equal(MAP.flatMap((row) => [...row]).filter((cell) => cell === 'K').length, 1);
});

test('companion markup includes dialog semantics, warnings, and honest text-only support', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const client = await readFile(new URL('../src/companion.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/companion.css', import.meta.url), 'utf8');
  const viteConfigSource = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');

  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /NOT LEGAL ADVICE/);
  assert.match(html, /Image\/PDF reading is not available/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB/);
  assert.match(client, /ArrowLeft.*ArrowRight|ArrowRight.*ArrowLeft/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(viteConfigSource, /wiki\|game-levels/);
});

test('Vite development middleware blocks direct, encoded, and /@fs wiki paths', () => {
  let middleware;
  const privacyPlugin = viteConfig.plugins.find((plugin) => plugin.name === 'kafkaland-server-only-markdown');
  privacyPlugin.configureServer({ middlewares: { use(handler) { middleware = handler; } } });

  function statusFor(url) {
    let status = 200;
    let nextCalled = false;
    middleware(
      { url },
      {
        set statusCode(value) { status = value; },
        get statusCode() { return status; },
        setHeader() {},
        end() {},
      },
      () => { nextCalled = true; },
    );
    return { status, nextCalled };
  }

  assert.deepEqual(statusFor('/wiki/05-bank-account.md'), { status: 404, nextCalled: false });
  assert.deepEqual(statusFor('/%77iki/05-bank-account.md'), { status: 404, nextCalled: false });
  assert.deepEqual(statusFor('/%2577iki/05-bank-account.md'), { status: 404, nextCalled: false });
  assert.deepEqual(statusFor('/@fs/project/wiki/05-bank-account.md'), { status: 404, nextCalled: false });
  assert.deepEqual(statusFor('/src/main.js'), { status: 200, nextCalled: true });
});
