---
name: domain
description: Use before naming anything in code (a class, type, table, field, event, endpoint or UI label), even in a one-line change; when making a decision worth recording; when building something a decision or requirement describes; when a person asks to add or change a requirement; when raising an open question; or when asked to set up a glossary, decision log and requirements in Notion. The team's shared language, decisions, open questions and requirements live in four linked Notion databases (Glossary, Decisions, Open questions, Requirements); this skill reads them first and writes to them by the team's rules.
---

# Domain: shared language, decisions and requirements in Notion

A team keeps its shared vocabulary, the reasons behind its choices, the questions it still has to answer and what the product must do in four linked Notion databases. People and agents read the same rows. Nothing is copied into the code repository: Notion is the only copy, so product people and domain experts without repository access can take part, and anyone can build views, dashboards and automations on it.

Every row is tagged with its **Bounded context** (subsystems with clear boundaries). Always write the column name in full, "Bounded context". "Context" alone is easy to misread as the context window.

This skill needs the Notion MCP. If its tools (search, fetch, create pages, query data sources) aren't available, say that the Notion MCP isn't connected and stop. Don't fall back to local files.

## Two modes

1. **Set up**: someone asks to create the databases and pages under a Notion page. Read `references/setup.md` and follow it. It uses `references/schemas.md` for the databases, `references/working-rules.md`, `references/context-map-template.md` and `references/data-models-template.md` for the pages, and `references/agents-snippet.md` for the project's instructions.
2. **Use**: the project's AGENTS.md or CLAUDE.md has the snippet that setup printed, with the Notion URLs and data source IDs. Follow the procedures below. Read `references/working-rules.md` when you need the full rule for a case below, and `references/schemas.md` for exact property names, types and options.

## The index in the session

The plugin's hooks put an index of the databases into each session: column names and options read live from Notion, every Agreed and Proposed glossary term, every open question, counts per bounded context, and one line per decision and requirement for the bounded contexts you're working in. It updates as Notion changes.

- The index points to pages; it doesn't replace them. Before acting on a decision or requirement, fetch its page by the ID at the end of its line.
- To load the titles for another bounded context, run the command the index prints, for example `node "<plugin>/scripts/domain-index.mjs" context "Payments"`. The script sits at `../../scripts/domain-index.mjs` from this skill's folder.
- If the index says it's unavailable, or isn't there, query Notion through the MCP instead.
- Never copy index content into memory files or the repository. It's regenerated each session, which is why it can't go stale. Memory may hold only a pointer: "the domain index is injected at session start".

## Before naming anything

Before naming anything in code (a class, type, table, field, event, endpoint or UI label), even in a one-line change:

1. Query the Glossary for the concept, filtered by Bounded context. The index lists the current terms; the query confirms the row's Status and Definition.
2. If an Agreed row exists, use the term exactly, in each layer's casing: Order Placed becomes `OrderPlaced` as an event and `order_placed` as a column. Don't shorten it, alias it or pluralize it differently.
3. If only a Proposed row exists, use it and say in the PR that it's still Proposed.
4. If no row exists, add one: Term, Status Proposed, Kind, Bounded context, a one-sentence Definition in the user's frame (what it means to the people who use the product, not how it's stored), and Source Engineering. Then use it.
5. If a word covers two things the code has to keep apart, add a Proposed row for each half, leave the original row alone, and say so in the PR. Product names the halves.

A bounded context's public interface uses only its own glossary. A word from another bounded context goes through a translation layer or an explicit mapping. If the team is replacing a legacy system, its table and column names never become glossary rows.

## Decisions

Write a decision when a word is split or merged, a boundary between bounded contexts moves, a bounded context's label changes, or the translation layer's scope changes, and for any other choice someone will ask "why?" about in a year.

1. Search the Summary column and the titles first. If a decision already covers it, don't decide it again. If one conflicts, propose a decision that supersedes it (Supersedes relation), never a quiet second one.
2. Create the page with Status left at Proposed: a short statement as the title, a one-line Summary written for search (what was decided and the key terms, no rationale), Bounded context, and Team (Engineering alone for a purely technical choice; add Product when it changes what users see, do or call things).
3. The body is one to three sentences: the context, what was decided, and why. Add "Considered options" or "Consequences" sections only when they earn their place.
4. Link Depends on only when reversing the other decision would force this one to be re-decided. A "see ADR-x" in the text is a dependency and belongs in the property.
5. A decision comes after the decisions it depends on, so ADR numbers read in dependency order. If you find a missing premise after the decisions that need it, record the premise, then ask the person before re-creating the dependent pages in order: a copy of an Accepted decision needs a person to mark it Accepted again. Gaps in the numbers are fine. Never drop or recreate the ADR property.

## Open questions

- Before building, read the open questions for the bounded context. Raise one your work depends on; don't settle it by picking a behavior in code.
- Add a question only a person can answer, as a row in Open questions (never in a page body): the question as one sentence, Provenance (who raised it, when, where, with a link), Bounded context, and the Requirements its answer affects. A question about the context map has a bounded context and no requirement. Leave Owner empty.
- Never answer a question yourself. If the code or the legacy system suggests an answer, write it in Answer as a finding that says where you found it, and leave Status at Open for a person to confirm.
- Never delete a question. One that no longer matters is Dropped, by a person.

## Requirements

- Read the requirements for the bounded context before building.
- Add, change or remove a requirement only when a person explicitly asks. Not on your own initiative, even when a conversation, ticket, meeting note, legacy code or test suggests one. If you think a requirement is missing, wrong or out of date, say so and ask.
- When asked, record it as the person stated it, name them in Provenance, and ask about anything ambiguous rather than filling the gap. A requirement whose source can't be named isn't recorded.
- State it twice: Plain English that anyone could follow, and a Precise statement that says who, what, when and how much, with "must", numbers and limits, in glossary terms linked in Glossary terms. Proposed terms are fine: a requirement often uses a word before the review agrees it, and the links show which ones are still Proposed. A word with no row gets a Proposed row first.
- Page body: acceptance criteria first, as a numbered list a test could check; then a Mermaid diagram wherever a picture says it faster; no open questions (those are rows in Open questions, linked in Questions).
- Status starts and stays at Proposed. Only a person makes a requirement Agreed, Deferred or Dropped. A replacement is a new page; the old one becomes Superseded and names it.

## Agreed is not built

- Read Built before relying on a decision or requirement. Status says what was agreed; Built says what exists.
- Set Built from what you can check in the repository, CI or a deploy, in the PR that builds it, and say so in the PR description. Partly means a "Built so far" section on the page says which part exists, the date it was checked, and "not confirmed" for anything you couldn't check.
- For a requirement, also add the ticket to its tracker links. The ticket links the requirement and says what it changes ("makes REQ-12 true for X"); it doesn't copy the requirement's text.

## What agents never do

- Write a local copy of these databases: no GLOSSARY.md, no docs/decisions/.
- Write a secret (a token, password, key or connection string) or personal data about customers or users (names, contact details, account or order details) to Notion: not in a row, a page, an Answer finding or a Provenance. Say where it lives instead, such as "the limit is set in the payments service's config".
- Rename an Agreed term in code.
- Mark a term Agreed, a decision Accepted, or a requirement anything beyond Proposed.
- Rename a select or multi-select option through the Notion API or MCP. That clears the option from every row that has it. Ask a person to rename it in Notion's property settings, which keeps the values. Renaming a whole property is safe, but property names are what people's views, dashboards and automations depend on, so a rename is a decision, announced to whoever builds on the databases.

## Working with Notion

- Fetch a database's data source before writing to it, and use its exact property names.
- Mermaid diagrams are plain Mermaid code blocks, kept small (few nodes, labels of a few words) and drawn top to bottom, because Notion scales them down to its narrow column. Notion opens a new diagram in split view and the API can't change that: after creating or recreating one, tell the person to switch it to Preview from the block's menu. To change a diagram, edit its text in place rather than replacing the block; that may keep the view they chose, but it isn't guaranteed, so say so.
- When you fill in a page, keep its existing headings and structure. The Context map and Data models pages carry a "Checked" line: update it when you check them against the code.
