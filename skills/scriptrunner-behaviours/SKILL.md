---
name: scriptrunner-behaviours
description: Use when a user asks to write, debug, refactor, or review a ScriptRunner Cloud behaviour in TypeScript, or mentions getFieldById, getContext, makeRequest, ONLOAD, ONCHANGE, extensions.yaml, field visibility, field validation, or template pre-filling on issue screens
version: "1.0.0"
updated: "2026-05-22"
---

# ScriptRunner Cloud Behaviours (TypeScript)

## Overview

Behaviours are imperative TypeScript scripts with globally-declared APIs (no imports). Events (ONLOAD, ONCHANGE) and view types (GIC, IssueView, IssueTransition) are configured in `extensions.yaml`, not in TypeScript code. The script runs top-to-bottom when triggered.

## Quick Reference

| API                       | Signature                                 | Purpose                              |
| ------------------------- | ----------------------------------------- | ------------------------------------ |
| `getFieldById(id)`        | `getFieldById<T>(id: T): Field<T>`        | Get a field by ID (type-safe)        |
| `getContext()`            | `() => Promise<ForgeContext>`             | Get issue key, site URL, environment |
| `makeRequest(url, opts?)` | `(url, opts?) => Promise<{status, body}>` | HTTP requests to Jira REST APIs      |
| `getChangeField()`        | `() => Field<any>`                        | Field that triggered ONCHANGE        |
| `isCreateView()`          | `() => boolean`                           | Currently on issue create screen     |
| `isIssueView()`           | `() => boolean`                           | Currently on issue detail view       |
| `isTransitionView()`      | `() => boolean`                           | Currently on transition dialog       |
| `console.warn/log/error`  | standard                                  | Logging to browser console           |

## Global APIs

### getFieldById

Returns a typed `Field<T>` object. The return type is determined by the field ID string literal.

```typescript
// Standard fields
const summaryField = getFieldById("summary")
const summaryValue = summaryField.getValue() // string

// Custom fields (use UUID from YAML)
const customField = getFieldById("customfield_10041")

// Get current value
const value = field.getValue()

// Set value
field.setValue("new value")

// Control field state (all return Field<T> for chaining)
field.setVisible(true)
    .setReadOnly(false)
    .setRequired(true)
```

### getContext

Returns Forge execution context. Must be awaited.

```typescript
const context = await getContext()
const issueKey = context.extension.issue.key
const siteUrl = context.extension.site.url
```

### makeRequest

HTTP requests to Jira REST APIs. Must be awaited.

```typescript
const context = await getContext()
const issueKey = context.extension.issue.key
const issue = await makeRequest(`/rest/api/2/issue/${issueKey}`)
console.log("Status:", issue.body.fields.status)
```

### View Detection

```typescript
if (isCreateView()) {
    // Pre-fill template on create
}
if (isTransitionView()) {
    // Validate on transition
}
if (isIssueView()) {
    // Show/hide fields on detail view
}
```

## Field Object Methods

| Method                                   | Returns              | Description           |
| ---------------------------------------- | -------------------- | --------------------- |
| `getValue()`                             | varies by field type | Current value         |
| `setValue(value)`                        | `Field<T>`           | Set value (chainable) |
| `getId()`                                | `FieldId`            | Field identifier      |
| `getType()`                              | `FieldType`          | Field type constant   |
| `getName()` / `setName(n)`               | string / `Field<T>`  | Display label         |
| `getDescription()` / `setDescription(d)` | string / `Field<T>`  | Description text      |
| `isVisible()` / `setVisible(v)`          | boolean / `Field<T>` | Visibility            |
| `isReadOnly()` / `setReadOnly(r)`        | boolean / `Field<T>` | Read-only state       |
| `isRequired()` / `setRequired(r)`        | boolean / `Field<T>` | Required state        |

## Type System

Get and set types are **asymmetric** — they differ for the same field:

| Field               | `getValue()` returns                    | `setValue()` accepts         |
| ------------------- | --------------------------------------- | ---------------------------- |
| `assignee`          | `{ accountId: string } \| null`         | `string \| null` (accountId) |
| `summary`           | `string`                                | `string`                     |
| `description`       | `ADF \| null`                           | `ADF \| string \| null`      |
| `labels`            | `string[]`                              | `string[]`                   |
| priority (select)   | `{ id: string; value: string } \| null` | `string \| null` (id)        |
| custom select       | `{ id: string; value: string } \| null` | `string \| null` (id)        |
| custom multi-select | `{ id: string; value: string }[]`       | `string[]` (ids)             |
| user picker         | `{ accountId: string } \| null`         | `string \| null` (accountId) |
| date picker         | `string \| null`                        | `string \| null`             |
| number              | `number \| null`                        | `number \| null`             |

## ADF Templates

Pre-fill the description field with structured content using Atlassian Document Format:

```typescript
{
    const descriptionField = getFieldById("description")
    const currentValue = descriptionField.getValue()
    if (!currentValue || (typeof currentValue === 'object' && currentValue.content?.length === 0)) {
        descriptionField.setValue({
            version: 1,
            type: "doc",
            content: [
                { type: "paragraph", content: [{ type: "text", text: "Steps to Reproduce", marks: [{ type: "strong" }] }] },
                { type: "orderedList", content: [
                    { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Step one" }] }] },
                    { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Step two" }] }] }
                ]}
            ]
        })
    }
}
```

> **Note:** The `{ ... }` block scope prevents `const` redeclaration errors if the script re-executes (e.g. on ONCHANGE events).

## Patterns

### Field Visibility

Show or hide fields based on another field's value. Configure with `ONLOAD` and `ONCHANGE` events in YAML so it runs on load and reacts to changes:

```typescript
{
const priorityField = getFieldById("priority")
const priorityValue = priorityField.getValue()

const assigneeField = getFieldById("assignee")
assigneeField.setVisible(priorityValue?.value === "High")
assigneeField.setRequired(priorityValue?.value === "High")
}
```

### ONCHANGE Reactive Pattern

When the trigger is `ONCHANGE`, use `getChangeField()` to identify which field changed, then act on others:

```typescript
{
const changedField = getChangeField()

if (changedField.getId() === "priority") {
    const priorityValue = changedField.getValue()
    const isHigh = priorityValue?.value === "High"

    getFieldById("assignee").setRequired(isHigh)
    getFieldById("duedate").setVisible(isHigh)
}
}
```

In `extensions.yaml`, set `event: ["ONCHANGE"]` and `fieldUuid` to the UUID of the field being watched (priority in this example).

### Validation

Behaviours do not have a native API for showing custom validation error messages. Use `setRequired(true)` to prevent empty submission, or implement validation logic in a **workflow validator** (Jira expression with `errorMessage`) for user-facing error text.

```typescript
// Prevent submission if a condition isn't met — no custom message possible
getFieldById("assignee").setRequired(true)
```

## Event Model

Events are configured in `extensions.yaml`, not in TypeScript:

```yaml
config:
  - fieldName: ""
    fieldUuid: "81a205f1-721a-4627-a3f2-c9767e1e83c4"
    path: behaviourA.ts
    event:
      - "ONLOAD"
      - "ONCHANGE"
    viewTypes:
      - "GIC"
      - "IssueTransition"
      - "IssueView"
    affectedFields:
      - "summary"
```

| Event      | When it fires                                             |
| ---------- | --------------------------------------------------------- |
| `ONLOAD`   | Behaviour-enabled screen loads (create, view, transition) |
| `ONCHANGE` | The field identified by `fieldUuid` changes value         |

Use `getChangeField()` inside ONCHANGE to identify the triggering field:

```typescript
const changedField = getChangeField()
console.log("Changed field ID:", changedField.getId())
```

**View types** (configured in YAML):

| View Type         | Screen                    |
| ----------------- | ------------------------- |
| `GIC`             | Global Issue Create       |
| `IssueView`       | Issue detail/display page |
| `IssueTransition` | Issue transition dialog   |

## YAML Binding

| YAML property             | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `config[].path`           | TypeScript file relative to `cloud/src/main/typescript/`  |
| `config[].fieldUuid`      | Field ID passed to `getFieldById()`                       |
| `config[].event`          | When the script executes                                  |
| `config[].viewTypes`      | Which screens the behaviour runs on                       |
| `config[].affectedFields` | Fields the behaviour modifies (platform optimization)     |
| `mappings`                | Project keys and work item types the behaviour applies to |

## Debugging

- **Logs:** `console.warn()`, `console.log()`, and `console.error()` output appears in the browser developer console (F12). Add `console.warn("Running")` at the top of the script to confirm it's executing.
- **TypeScript compiler warnings** during deployment are expected and safe to ignore.
- **Runtime errors:** Appear in the browser console. If a behaviour silently does nothing, open the console and check for uncaught errors before assuming the logic is wrong.

## Deployment

Managed by the ScriptRunner Dev & Deployment Tool (Gradle). Supports both bulk and individual behaviour deployment. See your project's `AGENTS.md` for the full command reference.

## Common Mistakes

- **Forgetting `await`** — `getContext()` and `makeRequest()` return Promises. Must await.
- **Redeclaring `const`** — Wrap top-level `const` declarations in `{ ... }` block scoping. The script may re-execute.
- **Wrong field ID format** — Can be a standard name (`"summary"`) or a UUID (`"81a205f1-..."`). Check against extensions.yaml.
- **Missing affectedFields** — The platform uses this for optimization. If you modify a field not listed, the change may not persist.
- **Incorrect setValue type** — Set types differ from get types. Use `string \| null` for assignee (accountId), not an object.
