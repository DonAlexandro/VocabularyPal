# Telegram Bot Vocabulary To Notion

## Description

**As a** user

**I want to** send one or multiple English vocabulary items to a Telegram bot and have them enriched and stored in my Notion database

**So that** I can capture vocabulary quickly without duplicates and keep a consistent learning database

---

## Acceptance criteria 1: Save a single vocabulary item successfully

Given: the Telegram bot is available

And: Notion database access is configured

And: the submitted vocabulary item does not already exist in Notion

When: I send one message containing exactly one English word, idiom, or phrasal verb

Then: the bot checks Notion for an existing record with the same Word value

And: the bot sends that vocabulary item to GPT API

And: GPT API returns a deterministic JSON array with one object containing word, definition, and example fields

And: the bot creates one new Notion row with Word, Definition, and Example populated from GPT output

And: the bot sends me a success message confirming the item was saved

---

## Acceptance criteria 2: Save multiple items from one multiline message

Given: the Telegram bot is available

And: Notion database access is configured

When: I send one message with multiple vocabulary items where each new item starts on a new line

Then: the bot parses each non-empty line as a separate vocabulary item

And: each parsed item is processed independently through duplicate check, GPT enrichment, and Notion insert

And: if one item fails, the bot continues processing remaining items in the same message

And: after processing all items, the bot sends one final summary with created, skipped, and failed counts plus per-failed-item reason

---

## Acceptance criteria 3: Skip duplicates without calling GPT

Given: at least one submitted vocabulary item already exists in Notion by Word value

When: I send that item to the bot

Then: the bot normalizes the submitted value by trimming leading/trailing whitespace and applying case-insensitive comparison without collapsing inner spaces

And: the bot applies the same normalization rule when checking Notion Word values

And: the bot detects the existing Notion record before GPT call

And: the bot does not send that duplicate item to GPT API

And: the bot does not create a duplicate Notion row

And: the success summary indicates that item was skipped as already existing

---

## Acceptance criteria 4: Enforce GPT response structure before Notion insert

Given: a submitted vocabulary item does not exist in Notion

When: the bot receives GPT output that is not a JSON array matching objects with word, definition, and example fields

Then: the bot rejects that output for insertion

And: the bot does not create or update a Notion row for that failed item

And: the bot sends an explicit error message indicating GPT response format validation failed

---

## Acceptance criteria 5: Report errors per failed phase

Given: I submit one or more vocabulary items

When: an error occurs in any processing phase

Then: the bot sends an error message that identifies the failed phase (input parsing, Notion duplicate check, GPT request, GPT format validation, or Notion insert)

And: the error message is sent in the same chat where I submitted the request

And: processing does not stop for remaining items in the same batch unless the whole request is unrecoverable

And: items that were successfully completed before and after an item-level failure remain saved in Notion

And: the final summary includes per-failed-item reason

---

## Acceptance criteria 6: Handle empty or whitespace-only lines in multiline input

Given: I send a multiline message that includes blank or whitespace-only lines

When: the bot parses the message

Then: blank lines are ignored

And: only non-empty lines are processed as vocabulary items

And: the bot does not send blank entries to GPT or Notion

---

## Acceptance criteria 7: Skip same-message duplicates after normalization

Given: I send one multiline message containing duplicate vocabulary items under the normalization rule (trim + case-insensitive, without collapsing inner spaces)

When: the bot processes the message

Then: the first unique occurrence is processed normally

And: later repeated occurrences in the same message are skipped

And: skipped repeated occurrences are counted in skipped total

And: skipped repeated occurrences are not sent to GPT and are not inserted into Notion
