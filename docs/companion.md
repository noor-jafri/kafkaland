# Kafkaland companion

Marlene is an in-world NPC backed by a separate server API. The browser never reads the wiki and never receives a model key. Retrieval reads the tracked Markdown files directly. There is no database, search service, persisted index, embedding model, or vector store.

## Local setup

Requires Node.js 20.12 or newer.

```sh
cp .env.example .env.local # reference only; this project does not auto-load env files
export COMPANION_SESSION_SECRET="$(openssl rand -hex 32)"
export COMPANION_ALLOWED_ORIGINS="http://127.0.0.1:5173,http://localhost:5173"
export COMPANION_API_KEY="your server-only key"
export COMPANION_MODEL="your model name"
export COMPANION_BASE_URL="https://your-openai-compatible-host.example/v1"
npm run dev:all
```

`npm run dev` still starts the original Vite game by itself. `npm run dev:api` starts only the API on port 8787. `npm run dev:all` runs both and preserves Vite hot reload. Vite proxies `/api` to the API and returns 404 for direct `/wiki/` or `/game-levels/` requests.

For local screenshots or automated browser checks without a paid call:

```sh
COMPANION_PROVIDER=deterministic \
COMPANION_ALLOW_TEST_PROVIDER=true \
COMPANION_SESSION_SECRET="local-only-secret-at-least-32-characters" \
npm run dev:all
```

The deterministic provider cannot start in production. Automated tests inject it directly and never make a paid model request.

## Retrieval and grounding

At API startup, `server/wiki-corpus.js`:

1. Reads the 23 tracked files in `wiki/` in filename order.
2. Validates that every file has an entry in `server/wiki-access.js`.
3. Splits Markdown at headings and retains path, title, heading, language, minimum level, and required server progress flags.
4. Filters sections against the signed server progress token before ranking.
5. Ranks only allowed sections with transparent BM25-style lexical scoring, title and heading boosts, and a small English/German bureaucracy term list.
6. Sends at most four bounded, allowed excerpts to the provider.

The service refuses unsupported questions. A dominant match in a locked file returns a fixed in-world progression hint without calling the model or returning the topic, source title, heading, or excerpt. Page 23 remains a standing glossary because the level design explicitly makes it available at every level.

Provider output is accepted only when citation IDs refer to excerpts sent in that request. Every answer paragraph must include an allowed inline citation. Letter deadlines and actions are accepted only when their evidence quote is an exact substring of the submitted letter. The model receives no database, filesystem, or raw retrieval tools.

Run `npm run wiki:check` to validate the deterministic corpus and print its SHA-256 digest. This command does not create or persist an index.

## Progression mapping

The level column comes directly from `game-levels/README.md`. Required flags implement the wiki prerequisite chain and current game events. They are not supplied as request fields by the browser.

| Wiki pages | Level | Server requirement |
|---|---:|---|
| 01 | 1 | Starting file |
| 02-03 | 1 | Arrival complete, set by the server's initial game state |
| 04 | 1 | Housing quest complete |
| 05, 06, 10, 15, 16 | 2 | Level 1 Anmeldung complete |
| 07, 08, 20, 21 | 3 | Level 2 complete |
| 09, 11-14, 17, 18 | 4 | Level 3 complete; page 11 also follows driving guidance |
| 19, 22 | 5 | Level 4 complete |
| 23 | Standing reference | Always available |

The current playable game exposes only three ordered actions: discover the companion, complete housing, and complete Level 1. It does not expose arbitrary level, quest, or unlock setters. The API rejects extra client fields and invalid transition order.

## Security boundary and honest limitation

The HTTP-only, SameSite=Strict cookie contains HMAC-signed progress. The browser cannot read or edit its level and quest claims. POST routes require an allowlisted same-origin `Origin`, accept small JSON bodies with exact fields, and apply per-session/IP throttling plus an in-flight limit. Production requires a stable secret of at least 32 characters and HTTPS so the cookie receives `Secure`.

The current game simulation still runs in the browser. A modified client can invoke the same narrow, valid progression actions earlier than the visible game would. Ordered server transitions prevent arbitrary level jumps, but cannot prove that the player physically walked to an NPC or collected a document. Truly tamper-proof progression needs a larger server-authoritative game simulation or signed event authority. This MVP does not claim to be cheat-proof.

This repository also contains the wiki. If the repository is public, a determined reader can read future pages from source control. The deployed game keeps those files out of browser assets and model context, which protects normal play and API access control, but it cannot make public source text secret.

## Letter privacy and safety

Kafkaland does not write letter text to files, cookies, logs, analytics, session state, or conversation history. The browser replaces the visible letter with a generic sealed-letter marker as soon as it is submitted. The text exists only in request memory while the configured model endpoint processes it.

The model provider necessarily receives letter text. Production operators must choose and configure an endpoint whose retention and training policy satisfies the product's no-persistence requirement. Do not deploy letter help against an endpoint that retains request bodies. The UI states that Kafkaland does not save the text and links no OCR claim: this MVP accepts pasted text only, not images or PDFs.

Every letter result displays a prominent not-legal-advice and current-information warning. Explicit deadlines and requested actions include exact quotes from the pasted text. Wiki guidance is cited only from unlocked files.

## Production deployment

Build the browser bundle with `npm run build`. Serve `dist/` from a static host and run `npm run start:api` in a private Node service that also receives the tracked `wiki/` directory. Route same-origin `/api/companion/*` traffic to that service. Do not copy `wiki/`, `game-levels/`, `.env` files, or provider credentials into the static artifact.

Set at minimum:

- `NODE_ENV=production`
- `COMPANION_SESSION_SECRET`
- `COMPANION_ALLOWED_ORIGINS` to the exact public game origin
- `COMPANION_API_KEY`, `COMPANION_MODEL`, and an HTTPS `COMPANION_BASE_URL`

The API has 16 KiB request limits, mode-specific input limits, provider and HTTP timeouts, cancellation propagation, safe structured logs containing sizes/status only, and no request body logging. Put normal TLS, process supervision, network rate limiting, and log retention controls at the deployment edge as well.

## Validation

```sh
npm test
npm run wiki:check
npm run build
```

Browser acceptance checks should start with `npm run dev:all` using the deterministic local provider, then approach Marlene's kiosk in the world. Verify an unlocked citation, a locked bank question, German input, letter deadlines/actions, Escape and close-button return to game, direct wiki denial, desktop rendering, and a narrow viewport.
