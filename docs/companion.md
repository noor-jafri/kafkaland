# Kafkaland companion

Marlene is an in-world NPC backed by a separate Node server. Production answers use OpenAI through `server/provider.js`. The browser never reads the wiki and never receives an API key, model name, endpoint, or provider timeout. Retrieval reads tracked Markdown directly without a database, embeddings, or a persisted index.

## Configuration

Requires Node.js 20.12 or newer. For local development, the captain only needs to supply the server-side API key:

```sh
OPENAI_API_KEY="your server-only OpenAI key" npm run dev:all
```

With no explicit provider override, an API key selects OpenAI. The server defaults to the structured-output-compatible `gpt-4.1-mini` model, `https://api.openai.com/v1`, and a 12-second timeout. Operators may override these with `OPENAI_MODEL`, `OPENAI_BASE_URL`, and `OPENAI_TIMEOUT_MS`. `.env.example` is a reference only; this project does not auto-load env files.

Local startup generates an ephemeral session secret and permits only the local Vite origins. Production does not use those conveniences: startup requires an explicit `COMPANION_SESSION_SECRET`, exact `COMPANION_ALLOWED_ORIGINS`, and `OPENAI_API_KEY`, and continues to reject non-HTTPS OpenAI endpoints, invalid timeout settings, and the deterministic provider. Request size, origin, rate, and in-flight controls remain enabled. `npm run dev:api` starts only the API. `npm run dev:all` starts the API and Vite proxy together.

For local browser checks without a paid request:

```sh
COMPANION_PROVIDER=deterministic \
COMPANION_ALLOW_TEST_PROVIDER=true \
COMPANION_SESSION_SECRET="local-only-secret-at-least-32-characters" \
npm run dev:all
```

The deterministic provider is rejected in production. Automated tests use test doubles and never call a paid API.

## Level-wide policy

`server/level-taxonomy.js` is the authoritative taxonomy derived from `game-levels/README.md` and wiki page titles:

| Level | Topics |
|---|---|
| 1 | Arrival, visas and passports, first days, accommodation, Anmeldung |
| 2 | Banking, health insurance, taxes, pension and liability insurance |
| 3 | Ausländerbehörde and residence permits, integration courses, qualifications, jobs |
| 4 | Driving and cars, public transport, Rundfunkbeitrag, waste, connectivity, social integration |
| 5 | Children and parental systems, permanent residence, citizenship |
| Standing | Page 23 glossary and official resources |

The server reads `currentLevel` only from the HMAC-signed, HTTP-only progress cookie. Request JSON cannot contain a level. Item collection and intermediate quest flags continue to drive gameplay but never restrict Marlene within the current level. Markdown retrieval uses only `minLevel <= currentLevel`; the standing glossary remains available.

A deterministic taxonomy classifies direct, paraphrased, German, adversarial, and mixed-topic input. The highest matched level wins. Genuinely ambiguous input uses a constrained OpenAI structured classification request containing only level names and topic descriptions, never locked excerpts. A future-level result returns a fixed in-world lock message before answer generation and before future wiki retrieval.

For current or earlier topics, the server ranks up to four bounded Markdown sections and calls OpenAI. Wiki facts require validated inline citations. If an allowed topic is missing detail, the server may permit general model guidance. Every uncited paragraph must carry an explicit `General guidance (not from the Kafkaland wiki)` label, and high-stakes output includes current-information and non-legal-advice warnings. A deterministic post-answer scan and, only for unresolved scope ambiguity, a constrained structured verifier safely replace future-level leakage.

## Security and privacy boundary

POST routes retain exact origin checks, small request limits, per-session/IP rate limits, in-flight limits, cancellation propagation, provider timeouts, bounded responses, and logs containing only route/status/timing/size metadata. Citation IDs must map to excerpts actually sent. No API key or provider configuration is serialized to the browser.

Pasted letters are not written to files, cookies, logs, analytics, session state, or conversation history. They exist in request memory and are sent to the configured OpenAI endpoint for processing. Operators must select OpenAI data controls suitable for this privacy promise. Exact deadline/action evidence must be a substring of the letter. A future-topic letter cannot bypass the level boundary; urgent safety wording may only direct the player to an appropriate official authority.

This is an access boundary for the deployed companion, not a claim of perfect secrecy. The repository and generic model knowledge may be public. A reader can inspect public wiki files, and a model may know generic facts. The server prevents future wiki excerpts from entering a locked request and rejects future-topic guidance in its response. The browser-hosted game can also invoke valid ordered progress actions early, so this design is progression-resistant rather than cheat-proof.

## Deployment and validation

Serve `dist/` as static files and run `npm run start:api` privately with the tracked `wiki/` directory. Route same-origin `/api/companion/*` traffic to it. Never copy `wiki/`, `game-levels/`, `.env` files, or credentials into the static artifact. Put TLS, process supervision, edge rate limiting, and suitable log retention around the service.

```sh
npm test
npm run wiki:check
npm run build
```

For browser acceptance, run the deterministic provider and verify current-level questions before collection, lost-passport guidance, earlier-level help, explicit/paraphrased/German/mixed future locks, prompt injection, private letter mode, citation/general labels, and desktop and narrow layouts.
