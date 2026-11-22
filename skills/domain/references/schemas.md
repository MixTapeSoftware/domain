# Database schemas

Four databases, each a child of the dashboard page. They're listed everywhere in this order: Glossary, Decisions, Open questions, Requirements. Every property gets the description below written into Notion as well, so people see it in the property's settings.

Property names are part of the interface. People's views, dashboards and automations depend on them, so a rename is a decision, announced to whoever builds on the databases. Write "Bounded context" in full, never "Context".

In the tables, *the team's bounded contexts* means the names the person gave during setup, in their order.

## Glossary

One row per word, event or role.

| Property | Type | Description |
|---|---|---|
| Term | Title | The word, as users say it |
| Kind | Select: Term, Event, Role | What kind of word it is |
| Bounded context | Select: the team's bounded contexts, plus "Outside the system" | The bounded context the word belongs to |
| Definition | Text | One or two sentences, in the user's frame |
| Status | Status: Proposed (default), Agreed, Deprecated | Proposed by anyone; Agreed only in the regular review; Deprecated keeps the old word with its date |
| Source | Select: Interview, Product, Engineering, Event storming, Backlog | Where the word came from |
| Replaces | Text | The old term this one replaces, if any |
| Decision record | Relation to Decisions | The decision that changed this row |
| Changed by / Changed on | Last edited by / Last edited time | |

## Decisions

One page per decision.

| Property | Type | Description |
|---|---|---|
| Decision | Title | Short title of the decision |
| ADR | Unique ID | Create it with the database: the API can't add an ID property later, and a dropped one can only be restored by hand |
| Summary | Text | One line, written for search: what was decided and the key terms someone would look for. No rationale |
| Status | Status: Proposed (default), Accepted, Deprecated, Superseded | Only a person marks a decision Accepted |
| Built | Select: Not built, Partly, Built | Whether what it describes exists yet. Separate from Status. Empty for a decision that isn't something you build |
| Bounded context | Multi-select: the team's bounded contexts, plus Spans contexts | Which bounded contexts it touches |
| Team | Multi-select: Product, Engineering | Engineering alone for a purely technical choice; add Product when it changes what users see, do or call things |
| Depends on / Enables | Two-way relation to itself | Link only when reversing the other decision would force this one to be re-decided |
| Supersedes / Superseded by | Two-way relation to itself | |
| Glossary rows | Relation, synced with the Glossary's Decision record | |
| Decided by, Decided on, Created | Person, Date, Created time | |

## Open questions

One row per question that has to be answered before a requirement can be agreed or a bounded context settled.

| Property | Type | Description |
|---|---|---|
| Question | Title | The question, as one sentence |
| OQ | Unique ID | |
| Status | Status: Open (default), Answered, Dropped | Open until answered; Dropped when it no longer matters. Answered and Dropped questions are kept |
| Answer | Text | The answer, who gave it and when |
| Answered on | Date | |
| Owner | Person | Who is finding the answer |
| Provenance | Text | Who raised it, when, and where, with a link if there is one |
| Bounded context | Multi-select, as on Decisions | |
| Requirements | Two-way relation to Requirements, shown there as Questions | The requirements the answer affects |
| Decision | Relation to Decisions | The decision that answered it, when the answer was one |
| Counts as open | Formula: 1 while Status is Open, else 0 | Lets Requirements count open questions. Notion's formulas can't filter a relation by the related row's Status, so the count is a rollup of this |
| Created | Created time | |

## Requirements

One page per functional requirement: something the product must do for the people who use it.

| Property | Type | Description |
|---|---|---|
| Requirement | Title | A short name for what the product must do |
| REQ | Unique ID | |
| Plain English | Text | What it means, as simply as possible and with no jargon, so anyone could follow it |
| Precise statement | Text | The requirement in precise technical English: exact, testable, in glossary terms (Agreed or Proposed) |
| Source | Select: Interview, Meeting, Product, Customer, Legacy system, Regulation, Engineering, Backlog | What kind of source it came from. Leave out Legacy system if there isn't one |
| Provenance | Text | Who asked for it or where it came from, when, and a link if there is one |
| Bounded context | Multi-select, as on Decisions | |
| Status | Select: Proposed, Agreed, Deferred, Dropped, Superseded | Proposed when recorded; only a person changes it |
| Built | Select: Not built, Partly, Built | As on Decisions |
| Decisions | Relation to Decisions | Decisions that shape or implement it |
| Glossary terms | Relation to Glossary | Glossary rows it uses |
| Tracker links | Text, named after the tracker (for example "Linear tickets") | The tickets that build it, as links |
| Questions | The other side of Open questions' Requirements relation | |
| Open questions | Rollup: sum of Counts as open, through Questions | How many of its questions are still open |
| Created | Created time | |

## Creating them through the Notion MCP

The Notion MCP's create-database tool takes a `CREATE TABLE` statement, and its update-data-source tool takes `ADD COLUMN` statements. Column names are double-quoted, options and descriptions single-quoted, and a single quote inside a description is doubled (`user''s`). `COMMENT '…'` writes the property's description. Read the tools' current descriptions before you start: if their syntax has changed, follow it and keep the names, types, options and descriptions below.

Create the databases in this order, because relations need their target to exist first. Each result returns the data source ID in a `<data-source url="collection://…">` tag; keep all four.

### Placeholders

- `{BC}`: the team's bounded contexts as options, colors cycling through blue, green, purple, orange, pink, brown, red, yellow. For example `'Catalog':blue, 'Ordering':green, 'Payments':purple`.
- `{DECISIONS}`, `{GLOSSARY}`, `{REQUIREMENTS}`: data source IDs from earlier steps, as `collection://…`.
- `{TRACKER}`: the links column's name, named after the issue tracker: "Linear tickets", "Jira issues", "GitHub issues". "Tracker links" if they have none.
- Unique ID prefixes `ADR`, `OQ`, `REQ`: a prefix can belong to only one data source per workspace. If one is taken, ask the person for another (for example `SHOP-ADR`) and keep the property's name.
- `{SOURCE_LEGACY}`: `'Legacy system':brown, ` when they're replacing a legacy system, otherwise nothing.

### 1. Decisions

Title "Decisions". Description: "One page per decision: what was decided and why."

```sql
CREATE TABLE (
  "Decision" TITLE COMMENT 'Short title of the decision',
  "ADR" UNIQUE_ID PREFIX 'ADR' COMMENT 'Create it with the database: the API can''t add an ID property later, and a dropped one can only be restored by hand',
  "Summary" RICH_TEXT COMMENT 'One line, written for search: what was decided and the key terms someone would look for. No rationale',
  "Status" STATUS('Proposed':yellow:to_do, 'Accepted':green:complete, 'Deprecated':gray:complete, 'Superseded':brown:complete) COMMENT 'Only a person marks a decision Accepted',
  "Built" SELECT('Not built':gray, 'Partly':yellow, 'Built':green) COMMENT 'Whether what it describes exists yet. Separate from Status. Empty for a decision that isn''t something you build',
  "Bounded context" MULTI_SELECT({BC}, 'Spans contexts':gray) COMMENT 'Which bounded contexts it touches',
  "Team" MULTI_SELECT('Product':purple, 'Engineering':blue) COMMENT 'Engineering alone for a purely technical choice; add Product when it changes what users see, do or call things',
  "Decided by" PEOPLE,
  "Decided on" DATE,
  "Created" CREATED_TIME
)
```

Then, on the new data source, add the two self-relations in one call:

```sql
ADD COLUMN "Depends on" RELATION('{DECISIONS}', DUAL 'Enables' 'enables') COMMENT 'Link only when reversing the other decision would force this one to be re-decided';
ADD COLUMN "Supersedes" RELATION('{DECISIONS}', DUAL 'Superseded by' 'superseded_by')
```

### 2. Glossary

Title "Glossary". Description: "One row per word, event or role, in the words the people who use the product use."

```sql
CREATE TABLE (
  "Term" TITLE COMMENT 'The word, as users say it',
  "Kind" SELECT('Term':blue, 'Event':orange, 'Role':purple) COMMENT 'What kind of word it is',
  "Bounded context" SELECT({BC}, 'Outside the system':gray) COMMENT 'The bounded context the word belongs to',
  "Definition" RICH_TEXT COMMENT 'One or two sentences, in the user''s frame',
  "Status" STATUS('Proposed':yellow:to_do, 'Agreed':green:complete, 'Deprecated':gray:complete) COMMENT 'Proposed by anyone; Agreed only in the regular review; Deprecated keeps the old word with its date',
  "Source" SELECT('Interview':blue, 'Product':purple, 'Engineering':orange, 'Event storming':pink, 'Backlog':gray) COMMENT 'Where the word came from',
  "Replaces" RICH_TEXT COMMENT 'The old term this one replaces, if any',
  "Decision record" RELATION('{DECISIONS}', DUAL 'Glossary rows') COMMENT 'The decision that changed this row',
  "Changed by" LAST_EDITED_BY,
  "Changed on" LAST_EDITED_TIME
)
```

If the tool rejects `LAST_EDITED_BY`, create the database without it and add it afterwards with `ADD COLUMN "Changed by" LAST_EDITED_BY`. If that fails too, tell the person to add a "Last edited by" property named "Changed by" by hand.

### 3. Requirements

Title "Requirements". Description: "One page per functional requirement: something the product must do for the people who use it."

```sql
CREATE TABLE (
  "Requirement" TITLE COMMENT 'A short name for what the product must do',
  "REQ" UNIQUE_ID PREFIX 'REQ',
  "Plain English" RICH_TEXT COMMENT 'What it means, as simply as possible and with no jargon, so anyone could follow it',
  "Precise statement" RICH_TEXT COMMENT 'The requirement in precise technical English: exact, testable, in glossary terms (Agreed or Proposed)',
  "Source" SELECT('Interview':blue, 'Meeting':green, 'Product':purple, 'Customer':orange, {SOURCE_LEGACY}'Regulation':red, 'Engineering':pink, 'Backlog':gray) COMMENT 'What kind of source it came from',
  "Provenance" RICH_TEXT COMMENT 'Who asked for it or where it came from, when, and a link if there is one',
  "Bounded context" MULTI_SELECT({BC}, 'Spans contexts':gray) COMMENT 'Which bounded contexts it touches',
  "Status" SELECT('Proposed':yellow, 'Agreed':green, 'Deferred':blue, 'Dropped':gray, 'Superseded':brown) COMMENT 'Proposed when recorded; only a person changes it',
  "Built" SELECT('Not built':gray, 'Partly':yellow, 'Built':green) COMMENT 'Whether what it describes exists yet. Separate from Status',
  "Decisions" RELATION('{DECISIONS}') COMMENT 'Decisions that shape or implement it',
  "Glossary terms" RELATION('{GLOSSARY}') COMMENT 'Glossary rows it uses',
  "{TRACKER}" RICH_TEXT COMMENT 'The tickets that build it, as links',
  "Created" CREATED_TIME
)
```

### 4. Open questions

Title "Open questions". Description: "Questions that have to be answered before a requirement can be agreed or a bounded context settled."

```sql
CREATE TABLE (
  "Question" TITLE COMMENT 'The question, as one sentence',
  "OQ" UNIQUE_ID PREFIX 'OQ',
  "Status" STATUS('Open':yellow:to_do, 'Answered':green:complete, 'Dropped':gray:complete) COMMENT 'Open until answered; Dropped when it no longer matters. Answered and Dropped questions are kept',
  "Answer" RICH_TEXT COMMENT 'The answer, who gave it and when',
  "Answered on" DATE,
  "Owner" PEOPLE COMMENT 'Who is finding the answer',
  "Provenance" RICH_TEXT COMMENT 'Who raised it, when, and where, with a link if there is one',
  "Bounded context" MULTI_SELECT({BC}, 'Spans contexts':gray) COMMENT 'Which bounded contexts it touches',
  "Requirements" RELATION('{REQUIREMENTS}', DUAL 'Questions') COMMENT 'The requirements the answer affects',
  "Decision" RELATION('{DECISIONS}') COMMENT 'The decision that answered it, when the answer was one',
  "Counts as open" FORMULA('if(prop("Status") == "Open", 1, 0)') COMMENT 'Lets Requirements count open questions. Notion''s formulas can''t filter a relation by the related row''s Status, so the count is a rollup of this',
  "Created" CREATED_TIME
)
```

### 5. Requirements: the rollup

Once Open questions exists, Requirements has its Questions relation. Add the count:

```sql
ADD COLUMN "Open questions" ROLLUP('Questions', 'Counts as open', 'sum') COMMENT 'How many of its questions are still open'
```

## Checking a database against this file

Fetch each data source and check, for every property above: the name, the type, every option in order, the description, and for relations the target and the synced property on the other side. Status options must sit in the right groups (Proposed and Open in To-do, the rest in Complete) so that the first one is the default. Report anything that differs. Add a missing property with `ADD COLUMN`. Never drop and recreate a unique ID, and never fix an option's name through the API: ask a person to rename it in Notion's property settings.
