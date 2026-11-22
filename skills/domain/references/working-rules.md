# Working rules page

Setup writes the content below to the "Working rules" page, a child of the dashboard. Replace `{PRODUCT}`, `{REVIEW}` (the team's review, for example "the weekly review") and `{TRACKER}` (for example "Linear"). If the team isn't replacing a legacy system, leave out the sentences marked *(legacy)*. Keep the wording plain: product people and engineers both read it.

---

How the {PRODUCT} team keeps its shared language, decisions, open questions and requirements. People and coding agents follow the same rules. Every row is tagged with its bounded context (subsystems with clear boundaries), and nothing here is copied into the code repository: these databases are the only copy.

## Glossary

- One row per word, event or role, tagged with its bounded context. Product owns the glossary, and engineering is told about changes. A change is a row whose Status moved, never a quiet edit.
- Anyone can add a Proposed row. The user's word wins when the user has one.
- A row becomes Agreed only in {REVIEW}, with product and engineering present.
- Renames are decisions. The old word stays as a Deprecated row with its date, the new row's Replaces points back to it, and Decision record links the decision.
- One word, one concept. If a word covers two things the code has to keep apart, engineering splits it and product names the halves.
- A bounded context's public interface uses only its own words. A word from another bounded context goes through a translation layer or an explicit mapping. *(legacy)* The legacy system's table and column names never become glossary rows.
- This database is the only copy.

## Decisions

- Write one when a word is split or merged, a boundary between bounded contexts moves, a bounded context's label changes, or the translation layer's scope changes. Also write one for any other choice someone will ask "why?" about in a year. The value is in recording that a decision was made and why, not in filling out sections.
- Format: the title is a short statement of the decision. The body is one to three sentences: the context, what was decided, and why.
- Order: a decision comes after the decisions it depends on, so ADR numbers read in dependency order. Record the premise first. If a premise turns up after the decisions that need it, re-create those pages in order. Gaps in the numbers are fine. Never drop or recreate the ADR property to close a gap.
- Search the Summary column and titles before proposing a decision. If one already covers it, don't decide it again. If one conflicts, propose a decision that supersedes it rather than a quiet second one.
- Depends on is only for real dependencies. A "see ADR-x" in a page's text is a dependency and belongs in the property.
- Only a person marks a decision Accepted.
- Built says whether what a decision describes exists yet, separately from Status. Agents set it from what they can check in the repository, CI or a deploy. Partly means a "Built so far" section on the page says which part exists, with the date it was checked, and "not confirmed" for anything that couldn't be checked.
- Optional sections, only when they earn it: Considered options and Consequences.

## Open questions

- A question lives in the Open questions database, not in a page body, so it can be counted, filtered and assigned.
- Anyone can add one, agents included, with Provenance, Bounded context, and the requirements its answer affects. A question about the context map has a bounded context and no requirement.
- Owner is whoever is finding the answer, left empty until someone takes it on.
- To answer one, write the answer and who gave it, set Answered on, move Status to Answered, and link the decision if the answer was one. If the answer changes a requirement, the requirement changes only when a person asks.
- Agents never answer a question themselves. A probable answer found in the code *(legacy)* or the legacy system goes in Answer as a finding, saying where it was found, and Status stays Open for a person to confirm.
- Questions are never deleted. One that no longer matters is Dropped.

## Requirements

- A requirement says what is needed, not how it's built. How it's built is a decision.
- Only on request. A requirement is added, changed or removed only when a person explicitly asks. Agents never do this on their own initiative, even when a conversation, ticket, meeting note, legacy code or test suggests one. An agent that thinks a requirement is missing, wrong or out of date says so and asks. When asked, it records the requirement as the person stated it, names them in Provenance, and asks about anything ambiguous rather than filling the gap.
- Every requirement is stated twice: in Plain English, and as a Precise statement that says who, what, when and how much, with "must", numbers and limits, in glossary terms, linked in Glossary terms. Proposed terms are fine: a requirement often uses a word before the review agrees it, and the links show which ones are still Proposed.
- A requirement whose source can't be named isn't recorded.
- Page body: acceptance criteria first, as a numbered list a test could check; then a Mermaid diagram wherever a picture says it faster (a flow, a state machine, a sequence); no open questions: those are rows in Open questions, linked in Questions.
- Only a person makes a requirement Agreed, Deferred or Dropped. A replacement is a new page, and the old one becomes Superseded and names it. An Agreed requirement's meaning never changes quietly.
- Built works as on Decisions. A {TRACKER} ticket links the requirement and states what it changes ("makes REQ-12 true for X"). It doesn't copy the requirement's text.

## What never goes in

- No secrets (tokens, passwords, keys, connection strings) and no personal data about customers or users (names, contact details, account or order details), from people or agents, anywhere in these pages. Say where such things live instead.

## Changing the databases themselves

- Property names stay stable: people's views, dashboards and automations depend on them. A rename is a decision, announced to whoever builds on the databases.
- Rename a select or multi-select option by hand, in Notion's property settings, which keeps the values. Renaming an option through the API clears it from every row that has it.
- Diagrams are plain Mermaid, so anyone can edit them. Keep them small and top to bottom. A new diagram opens in split view: switch it to Preview from the block's menu.
