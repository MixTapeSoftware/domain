# domain

An agent skill, packaged as a plugin for Claude Code and Codex. It sets up and maintains a team's shared language, decisions, open questions and requirements in four linked Notion databases, and teaches coding agents to read them before they name or build anything.

- **Glossary**: one row per word, event or role, tagged with its bounded context (subsystems with clear boundaries).
- **Decisions**: one page per decision, with what was decided and why.
- **Open questions**: what has to be answered before a requirement can be agreed or a bounded context settled.
- **Requirements**: what the product must do, stated in plain English and precisely.

Setup also creates a dashboard and three pages: Working rules, a Context map and Data models.

Everything lives in Notion, and nothing is copied into the code repository. That's deliberate:
- Product people and domain experts without repository access can read and add to it.
- Notion's own views, dashboards, charts, automations and integrations work on it.
- Anyone can build those, not only developers.

The plugin also ships hooks that put a short index of the databases into every agent session, so an agent knows which terms, decisions and questions exist before it knows to search for them.

## What you need

- **The Notion MCP**, connected in your agent. Use Notion's hosted server (`https://mcp.notion.com/mcp`) or Notion's own plugin. The skill reads and writes Notion only through it. If it isn't connected, the skill says so and stops; it never falls back to local files.
- **Node 18 or later**, for the index hooks. No packages to install: the script uses Node's standard library only.
- **Optionally, a read-only Notion integration token** for the index hooks. Without it the hooks print nothing, and agents query Notion through the MCP instead.

## Install

### Claude Code

```sh
claude plugin marketplace add MixTapeSoftware/domain
claude plugin install domain@domain-skill
```

From a local clone, use `claude plugin marketplace add ./domain` instead. To try it without installing, start a session with `claude --plugin-dir ./domain`.

### Codex

```sh
codex plugin marketplace add MixTapeSoftware/domain
```

Then open `/plugins` in Codex, install **domain** from the **domain-skill** marketplace, and start a new session. Codex runs a plugin's hooks only after you review and trust them, so open `/hooks` and trust the two domain hooks. To turn the plugin on for a single repository, add this to that repository's `.codex/config.toml`:

```toml
[plugins."domain@domain-skill"]
enabled = true
```

## Set up the Notion side

In a session in your project, with the Notion MCP connected, ask:

> Use the domain skill to set up our glossary, decisions and requirements in Notion under https://www.notion.so/… (a page you can edit)

The skill asks four things before creating anything:
- the product's name;
- its bounded contexts (it never invents them);
- your issue tracker, which names the Requirements links column ("Linear tickets", "Jira issues" and so on);
- whether you're replacing a legacy system.

It then creates:
- the dashboard page, with the four databases as its children;
- every property, with its description written into Notion;
- the relations between the databases;
- one Open questions view per bounded context;
- the Working rules, Context map and Data models pages.

Setup is safe to run twice. It finds what already exists under the parent page and reuses it.

When it finishes it:
- writes `.domain/config.json` in your repository, which holds database IDs and no secrets: commit it;
- prints a snippet with the real Notion URLs and data source IDs, for you to paste into the project's `AGENTS.md` or `CLAUDE.md`;
- reminds you to switch each new Mermaid diagram to Preview from the block's menu, because Notion's API can't choose how a diagram is shown.

## The session index

The hooks run `scripts/domain-index.mjs`:

| Hook | Claude Code | Codex | Runs |
|---|---|---|---|
| SessionStart (`startup`, `resume`, `clear`, `compact`) | `hooks/hooks.json` | `hooks/codex-hooks.json` | `full` |
| UserPromptSubmit | `hooks/hooks.json` | `hooks/codex-hooks.json` | `delta` |

The index points to pages; it never replaces them. An agent fetches the full page by ID before acting on a decision or requirement.

- **Tier 1, always loaded.** Each database's column names, plus the options of Bounded context and Status, read live from Notion so a renamed column can't go stale. Every Agreed and Proposed glossary term, with a one-line definition; Deprecated terms appear as "old → use new". Every open question, grouped by bounded context. A count of decisions and requirements per bounded context, and links to the Context map and Data models.
- **Tier 2, by bounded context.** One line per live decision and requirement (ID, title, Status, Built, page ID) for the bounded contexts you're working in. Decisions tagged "Spans contexts" are always included. The script works out the bounded contexts from the paths changed on your branch, matched against the globs in `.domain/config.json`, and then from the branch name (`feature/payments-refunds` → Payments). If it can't work any out, it lists every title when they fit the budget, and otherwise how to ask for one.
- **Tier 3, on demand.** The full page, fetched by ID through the Notion MCP.

```sh
node scripts/domain-index.mjs full [--stats]          # tiers 1 and 2
node scripts/domain-index.mjs context Payments [...]  # tier 2 for the bounded contexts named
node scripts/domain-index.mjs delta                   # what changed since this session's last index
node scripts/domain-index.mjs --doctor                # explains the setup and what's missing
```

**Delta.** `delta` asks Notion at most once per interval (5 minutes by default), and only for rows edited since its last check. Within the interval it makes no request at all. It prints the lines that changed, or nothing. Per-session state lives in `.domain/cache/<session id>.json`, which ignores itself in git. It's only a cache: everything in it comes from Notion and is rebuilt every session.

**Budget.** About 3,000 tokens by default, and never more than 9,500 characters, because Claude Code passes at most 10,000 characters of hook output to the model and saves anything longer to a file. When the index is over budget it shortens glossary definitions first, then replaces the tier-2 titles with counts and the `context` command. It says so in the index itself, and `--stats` reports the sizes. Token counts are estimated as characters ÷ 3.5.

**Failure never blocks a session.**
- With no token, or outside a configured project, the hooks print nothing.
- If Notion is unreachable or slow, `full` gives up after 3 seconds in total, prints one line saying the index is unavailable, and exits 0.
- A failing `delta` says so once per session.
- The script honours `HTTPS_PROXY` and `NO_PROXY`. It opens the proxy tunnel itself, so it doesn't depend on `NODE_USE_ENV_PROXY`.

**Token.** Create an internal integration in Notion (Settings → Connections → Develop or manage integrations) with only the **Read content** capability. Add it to the dashboard page under ••• → Connections, so its child databases inherit access. Then put the secret in your shell profile, never in a file the repository tracks:

```sh
export NOTION_TOKEN=…
```

`--doctor` checks the token, the proxy, each database and the bounded-context mapping.

**Nothing goes to memory.** Index content is regenerated every session, which is why it can't go stale. Agents never copy it into memory files or the repository. Memory may hold only a pointer: "the domain index is injected at session start".

**API.** The script uses Notion API version `2026-03-11` and its data source endpoints: retrieve a data source, and query a data source with `filter_properties`.

### Project config

`.domain/config.json`, written by setup:

```json
{
  "product": "Online Orders",
  "tokenEnv": "NOTION_TOKEN",
  "notion": {
    "dashboard": { "url": "https://www.notion.so/…" },
    "contextMap": { "url": "https://www.notion.so/…" },
    "dataModels": { "url": "https://www.notion.so/…" },
    "workingRules": { "url": "https://www.notion.so/…" },
    "databases": {
      "glossary": { "url": "https://www.notion.so/…", "dataSourceId": "…" },
      "decisions": { "url": "https://www.notion.so/…", "dataSourceId": "…" },
      "openQuestions": { "url": "https://www.notion.so/…", "dataSourceId": "…" },
      "requirements": { "url": "https://www.notion.so/…", "dataSourceId": "…" }
    }
  },
  "index": { "budgetTokens": 3000, "maxChars": 9500, "deltaIntervalMinutes": 5, "timeoutMs": 3000 },
  "boundedContexts": {
    "Payments": { "paths": ["src/payments/**"], "branch": ["billing"] }
  }
}
```

`branch` is optional: extra words that mark a branch as belonging to that bounded context.

### Claude Code and Codex

| | Claude Code | Codex |
|---|---|---|
| Plugin manifest | `.claude-plugin/plugin.json` | `.codex-plugin/plugin.json` |
| Marketplace | `.claude-plugin/marketplace.json` | `.agents/plugins/marketplace.json` |
| Skill | `skills/domain/SKILL.md` | the same file |
| Hooks | `hooks/hooks.json`, with `${CLAUDE_PLUGIN_ROOT}` | `hooks/codex-hooks.json`, with `${PLUGIN_ROOT}` |
| SessionStart output reaches the model | yes: plain stdout is added as context | yes, according to Codex's hook docs: plain stdout is added as developer context |
| UserPromptSubmit output reaches the model | yes | yes, according to the same docs |
| Output size limit | 10,000 characters, then saved to a file with a 2,000-character preview | about 2,500 tokens by default, then saved to a file; `codex-hooks.json` raises it to 3,500 with `additionalContextLimit` |
| Hooks need approval | no | yes: review and trust them in `/hooks` |

So far the hooks have been run only in Claude Code. They're configured for Codex from its current documentation, but they haven't been run in a Codex session.

## Recall test

There's no vector search. The data is small and already tagged, the glossary needs exact matching, and a model can scan a list of titles for meaning. Instead, `evals/recall/` checks whether tier 2 holds what mattered.

Each case in `evals/recall/cases/` is a ticket, the branch and paths someone would work on, and the decision IDs that mattered. The script works out the bounded contexts the way the index does, then reports how many of those decisions are in the titles the index would load:

```sh
node evals/recall/score.mjs --config path/to/.domain/config.json
```

It also reports each bounded context's tier-2 size against the budget. Two signals mean it's time to add an embedded index (sqlite-vec or LanceDB, combining keyword and vector search, rebuilt by the same sync): a falling score, or one bounded context outgrowing the budget. The three example cases use the made-up online-orders domain in `test/fixtures/`, and one of them misses on purpose, to show what a miss looks like.

## Development

```sh
npm test                                    # node --test, against a mock Notion API
node test/mock-notion.mjs --port 8787       # the mock, for trying the script by hand
DOMAIN_NOTION_API_BASE=http://127.0.0.1:8787/v1 NOTION_TOKEN=mock-token \
  node scripts/domain-index.mjs full --stats
claude plugin validate .
```

`DOMAIN_NOTION_API_BASE` exists for the mock and tests. `DOMAIN_CONFIG` points the script at a config outside the usual `.domain/config.json`.

### Known limits

- `delta` can't see a row moved to the trash, because Notion's query leaves trashed rows out. The next `full` (at session start, resume or compaction) drops it.
- Notion rounds `last_edited_time` to the minute, so `delta` looks back an extra minute and drops duplicates.
- Column descriptions, synced relation names and the unique ID prefixes are created through the Notion MCP's SQL-style schema tools. If a future MCP rejects one, setup says which property to add by hand.

## Layout

```
.claude-plugin/       Claude Code plugin and marketplace manifests
.codex-plugin/        Codex plugin manifest
.agents/plugins/      Codex marketplace
skills/domain/        SKILL.md and references/ (schemas, setup, working rules, page templates, agent snippet)
hooks/                hook configuration for each tool
scripts/              domain-index.mjs
evals/recall/         recall cases and score.mjs
test/                 mock Notion API, fixture, tests
```
