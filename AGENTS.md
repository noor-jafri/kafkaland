# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Use the scripts in `package.json` for the authoritative automated test and production build commands.
- Keep house sizing and entrance anchoring centralized in `src/house.js`; its Craftpix runtime asset attribution lives in `assets/Craftpix/README.md` and regression checks live in `test/house.test.js`.
- Keep tree variants, trunk anchors, and visual bounds centralized in `src/tree.js`; the exact Craftpix license/source attribution lives in `assets/Craftpix/trees/` and regressions live in `test/tree.test.js`.
- The companion's direct-Markdown retrieval, progression boundary, provider setup, privacy limits, and deployment model are documented in `docs/companion.md`; there is intentionally no database or persisted search index.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
