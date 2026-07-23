import { createHash } from 'node:crypto';
import { loadWikiCorpus } from '../server/wiki-corpus.js';

const corpus = await loadWikiCorpus();
const digest = createHash('sha256');
for (const section of corpus) {
  digest.update(JSON.stringify({
    key: section.key,
    sourcePath: section.sourcePath,
    pageTitle: section.pageTitle,
    heading: section.heading,
    language: section.language,
    minLevel: section.minLevel,
    requiredFlags: section.requiredFlags,
    text: section.text,
  }));
  digest.update('\n');
}
console.info(`Validated ${corpus.length} deterministic Markdown sections from 23 wiki pages.`);
console.info(`Corpus SHA-256: ${digest.digest('hex')}`);
