# Setup

Creates, under a parent Notion page, the dashboard page, the four databases (Glossary, Decisions, Open questions, Requirements), and the Working rules, Context map and Data models pages, all through the Notion MCP. Then it writes the project config and prints the agent instructions snippet.

Setup is safe to run twice: it looks for what already exists under the parent and reuses it. It never deletes, renames or overwrites anything it finds, and a second run against a finished setup creates nothing.

## 0. Check the Notion MCP

You need its search, fetch, create-pages, update-page, create-database, update-data-source and create-view tools. If they aren't available, say that the Notion MCP isn't connected and stop. Don't create local files instead.

Before writing page content, read `notion://docs/notion-flavored-markdown-spec` through the MCP (the fetch tool takes that URI). Before creating views, read `notion://docs/view-dsl-spec` the same way.

## 1. Ask before creating anything

Ask for these in one message, and wait for the answers:

1. **The parent page**: a Notion page URL. Fetch it to check you can see and edit it.
2. **The product's name**: it names the dashboard ("{Product} domain") and goes in the pages.
3. **Its bounded contexts** (subsystems with clear boundaries), in the order they should appear. Use the names they give, exactly. Never invent bounded contexts and never guess them from the code. If they can't name any yet, stop and suggest they decide them first, for example in an event-storming session.
4. **Their issue tracker**, which names the Requirements links column: "Linear tickets", "Jira issues", "GitHub issues", or "Tracker links" if they have none.
5. **Whether they're replacing a legacy system.** If they are, the Requirements Source column gets a "Legacy system" option, the Data models pages get an "In the legacy system" column, and the rules mention the translation layer.

Also ask, or use these defaults if they don't mind: what their regular glossary review is called ("the weekly review"), and which code paths belong to each bounded context (for the project config; propose globs from the repository's folders, such as `src/billing/**`, and let them confirm).

## 2. Find what already exists

1. Fetch the parent page. Look for a child page titled "{Product} domain". If there's none, search for that title and check whether a result's parent is the parent page.
2. If the dashboard exists, fetch it. Its children tell you which of these exist already: databases titled Glossary, Decisions, Open questions and Requirements; pages titled Working rules, Context map and Data models. Fetch each database you find to get its data source ID, and check its schema against `schemas.md` (see "Checking a database" there). Add missing properties with `ADD COLUMN`; report other differences rather than changing them.
3. Note what's missing. Everything below runs only for what's missing. If nothing is missing, go straight to step 8.

## 3. Create the dashboard

Create a page under the parent titled "{Product} domain", with only its first line for now:

> The shared language, decisions, open questions and requirements of {Product}, in one place that people and agents both read. Every row is tagged with its bounded context (subsystems with clear boundaries).

The rest of its content comes in step 7, once the databases and pages exist.

## 4. Create the databases

Follow `schemas.md` exactly: create Decisions, Glossary, Requirements and Open questions in that order, each with the dashboard as parent, then add Decisions' self-relations and the Requirements rollup. Use the title and description given there for each database. Keep each data source ID (`collection://…`) and each database URL.

- If a unique ID prefix is already used in the workspace, ask the person for another and carry on.
- If the tool rejects a property type, create the rest, then tell the person exactly which property to add by hand, with its name, type and description.

## 5. Create the views

1. On Open questions, add one table view tab per bounded context (`database_id` set to the Open questions database), named after the bounded context, configured `FILTER "Bounded context" = "{BC}"; FILTER "Status" = "Open"`. The tool returns each view as `view://{VIEW_ID}`; a page can't link to that, so build the link from the database URL instead: `{OPEN_QUESTIONS_DB_URL}?v={VIEW_ID without dashes}`. Keep these links for the Context map.
2. On Glossary, add a view tab "By bounded context" grouped by Bounded context.

## 6. Create the pages

Create these as children of the dashboard. Get `{COMMIT}` from `git rev-parse --short main` in the project (or say "not checked against code yet" if there's no repository or no commits), and write `{DATE}` as a date mention, `<date start="YYYY-MM-DD" />`.

The Context map and the data model pages link to each other, so create in this order:

1. **Working rules**: the content from `working-rules.md`, with its placeholders filled.
2. **Context map**, empty for now (content `<p />`), to get its URL.
3. **Data models**: the index page from `data-models-template.md`, then one child page per bounded context, "{BC} data model", from the same file. At setup a bounded context has no entities yet, so its diagram holds only a Mermaid comment showing the form, for example `%% Add entities in Glossary words, for example: Order ||--|{ Order-line : contains`. That keeps the block valid Mermaid.
4. **Context map** content: replace the empty page with the skeleton from `context-map-template.md`, one section per bounded context, using the Open questions links from step 5 and the data model pages from step 3. Then add the two linked views at its bottom, as the template says.

## 7. Fill in the dashboard

If you created the dashboard in step 3, replace its content with the layout below. Keep the exact `<database>` and `<page>` tags that a fetch of the dashboard returns for its children, so they move into their sections instead of being deleted.

If the dashboard already existed, never replace its content: people may have added their own text, links and views to it, and a replacement deletes them. Fetch it, then add only the sections for what this run created, each with its heading, line and exact tag from the layout below, where the layout puts it. Edit only those parts and leave every other block as it is. If a new child's tag can't be moved into its section without replacing the page, leave it where Notion put it and tell the person in step 10.

In both cases, then add the inline overview with the create-view tool (`parent_page_id` set to the dashboard, which appends at the end): a Decisions table named "Recent decisions" (`SORT BY "Created" DESC; SHOW "Decision", "ADR", "Status", "Built", "Bounded context"`) and a Glossary table named "Recent glossary changes" (`SORT BY "Changed on" DESC; SHOW "Term", "Status", "Bounded context", "Changed on"`).

On a second run, don't add these views again if the dashboard already shows them: a fetch lists them under "Recent changes" as inline `<database … inline="true">` tags whose `data-source-url` is the Decisions or Glossary data source.

````markdown
The shared language, decisions, open questions and requirements of {Product}, in one place that people and agents both read. Every row is tagged with its bounded context (subsystems with clear boundaries).

## Glossary

One row per word, event or role, in the words the people who use {Product} use.

<database url="{GLOSSARY_DB_URL}" …>Glossary</database>

## Decisions

One page per decision: what was decided and why.

<database url="{DECISIONS_DB_URL}" …>Decisions</database>

## Open questions

What has to be answered before a requirement can be agreed or a bounded context settled.

<database url="{OPEN_QUESTIONS_DB_URL}" …>Open questions</database>

## Requirements

What {Product} must do for the people who use it.

<database url="{REQUIREMENTS_DB_URL}" …>Requirements</database>

## Context map

A bounded context is a subsystem with clear boundaries and its own vocabulary. The context map shows what happens in each one and how they connect.

<page url="{CONTEXT_MAP_URL}">Context map</page>

## Data models

One conceptual diagram per bounded context, in glossary words:

<page url="{DATA_MODELS_URL}">Data models</page>

{ONE LINE PER BOUNDED CONTEXT: - <mention url="{BC_DATA_MODEL_URL}">{BC} data model</mention>}

## Working rules

How people and agents read and write all of this.

<page url="{WORKING_RULES_URL}">Working rules</page>

## Recent changes
````

## 8. Check the result

Fetch each of the four data sources and check them against `schemas.md`: every property, type, option (in order), description and relation, including the synced properties on the other side (Glossary rows, Enables, Superseded by, Questions) and the Open questions rollup. The MCP shows a unique ID as `auto_increment_id` without its prefix; the prefix shows on the first row's ID (ADR-1). Fetch the dashboard and check that it lists all four databases and the three pages, and that each bounded context has a data model page. Fix what you can; list what the person has to fix by hand.

## 9. Write the project config

If you're working in the project's repository, write `.domain/config.json` (and nothing else in the repository). It holds no secrets and is meant to be committed; the index script's cache goes in `.domain/cache/`, which ignores itself. If the file exists, update its Notion values and keep the person's paths, budget and interval.

```json
{
  "product": "{Product}",
  "tokenEnv": "NOTION_TOKEN",
  "notion": {
    "dashboard": { "url": "{DASHBOARD_URL}" },
    "contextMap": { "url": "{CONTEXT_MAP_URL}" },
    "dataModels": { "url": "{DATA_MODELS_URL}" },
    "workingRules": { "url": "{WORKING_RULES_URL}" },
    "databases": {
      "glossary": { "url": "{GLOSSARY_DB_URL}", "dataSourceId": "{GLOSSARY_DS_ID}" },
      "decisions": { "url": "{DECISIONS_DB_URL}", "dataSourceId": "{DECISIONS_DS_ID}" },
      "openQuestions": { "url": "{OPEN_QUESTIONS_DB_URL}", "dataSourceId": "{OPEN_QUESTIONS_DS_ID}" },
      "requirements": { "url": "{REQUIREMENTS_DB_URL}", "dataSourceId": "{REQUIREMENTS_DS_ID}" }
    }
  },
  "index": { "budgetTokens": 3000, "maxChars": 9500, "deltaIntervalMinutes": 5, "timeoutMs": 3000 },
  "boundedContexts": {
    "{BC}": { "paths": ["{glob}"], "branch": ["{optional extra word to match in branch names}"] }
  }
}
```

The `boundedContexts` keys are the bounded contexts exactly as they're spelled in Notion. `branch` is optional: a branch name already matches a bounded context when it contains the name as a word (`feature/payments-refunds` matches Payments).

## 10. Hand over

Print, in this order:

1. The agent instructions snippet from `agents-snippet.md`, with every placeholder replaced by the real URLs and data source IDs. Check that no `{` is left. Tell the person to paste it into the project's AGENTS.md or CLAUDE.md.
2. What setup created and what it found already there, as two short lists.
3. Anything they have to do by hand, from steps 4, 7 and 8.
4. "Notion opened each new diagram in split view: switch each to Preview from the block's menu." Name the pages that have diagrams.
5. For the session index hooks: create a read-only Notion integration (only the "Read content" capability), add it to the dashboard page under ••• → Connections, and put its secret in `NOTION_TOKEN` in their shell profile, never in a file the repository tracks. `node <plugin>/scripts/domain-index.mjs --doctor` checks the result. In Codex, they also review and trust the plugin's hooks in `/hooks`.
