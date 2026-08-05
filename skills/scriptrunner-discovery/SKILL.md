---
name: scriptrunner-discovery
description: Use when a user needs to find Jira custom field IDs, test a JQL query, inspect an issue's data structure, discover project keys, look up workflow statuses, or find transition IDs, role IDs, issue type IDs, or link type IDs before writing ScriptRunner scripts
version: "1.0.0"
updated: "2026-05-22"
---

# ScriptRunner Jira Discovery

## Overview

Before writing ScriptRunner scripts, you often need to know custom field IDs, test JQL queries, or inspect issue data structures. This skill provides three methods in priority order. Use whatever is available in your environment.

**MCP Detection:** Check if Atlassian MCP is available by looking for the MCP server configuration:
- **Claude Code:** `.mcp.json`
- **OpenCode:** `.opencode/opencode.json`

If found, also check which token type is configured — this determines which tool categories are available. Look for a `headers` block inside the `atlassian` server entry (`mcpServers.atlassian.headers` in Claude Code, `mcp.atlassian.headers` in OpenCode):

| Config auth | Token type | Standard Jira tools | Teamwork Graph tools |
|-------------|-----------|---------------------|---------------------|
| No `headers` block | OAuth (browser) | ✓ | ✓ |
| `headers` with non-`ATATT3x` token | Fine-grained (scoped) | ✓ | ✓ |
| `headers` with `ATATT3x…` token | Classic (legacy) | ✓ (if org setting on) | ✗ — will 403 |

### Client config notes

**Claude Code** uses `"type": "http"` in `.mcp.json`:
```json
{ "mcpServers": { "atlassian": { "type": "http", "url": "https://mcp.atlassian.com/v1/mcp" } } }
```

**OpenCode** uses `"type": "remote"` in `.opencode/opencode.json` (not `"http"` — that field means something different in OpenCode):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "atlassian": {
      "type": "remote",
      "url": "https://mcp.atlassian.com/v1/mcp",
      "enabled": true
    }
  }
}
```

## Method 1 — Atlassian MCP (Preferred)

Use when MCP is configured and available.

### Tool Selection

The Atlassian MCP exposes two distinct tool categories — use the right one for each operation:

| Operation | Tool category | Notes |
|-----------|--------------|-------|
| JQL search, issue lookup, custom field IDs, project/role/type IDs | **Standard Jira tools** | Use for all CRUD and discovery |
| Relationships: issue ↔ page, issue ↔ PR, cross-product connections | **Teamwork Graph** (`getTeamworkGraphContext` / `getTeamworkGraphObject`) | Requires fine-grained token or OAuth; classic tokens return 403 |

**Do not use Teamwork Graph tools for JQL queries or field discovery — they are for entity relationships only.** After calling `getTeamworkGraphContext`, call `getTeamworkGraphObject` on returned ARIs to get full content.

---

### Field Discovery `[Standard Jira tools]`
```
Show me all custom fields with their IDs and types in Jira
```
MCP returns field name, ID (`customfield_XXXXX`), type, and whether it's custom. Use these IDs in `getFieldById()` calls or scripts.

### JQL Testing `[Standard Jira tools]`
```
Run this JQL query and show me the first 3 results:
project = PROJ AND statusCategory = Done ORDER BY updated DESC
```
Verifies JQL syntax and returns matching issues. Use before deploying escalation services.

### Issue Data Inspection `[Standard Jira tools]`
```
Show me all field values for issue PROJ-123, including custom fields
```
Inspect what data a script would receive. Particularly useful for understanding the shape of `assignee`, `priority`, custom field values.

### Project Config `[Standard Jira tools]`
```
List all projects with their issue types and workflow statuses
```
Useful for configuring `mappings` in behaviours or project targeting in listeners.

### Workflow IDs `[Standard Jira tools]`
```
Show me all project roles with their IDs
Show me all issue types for project PROJ with their numeric IDs, including subtask types
Show me the available transitions for issue PROJ-1 with their IDs
Show me all issue link types with their IDs
```
These numeric IDs are required for workflow post functions: `roleId`, `issueTypeId`, `transitionId`, `linkTypeId`.

### Entity Relationships `[Teamwork Graph — requires fine-grained token or OAuth]`
```
What Confluence pages are linked to issue PROJ-1?
What pull requests are associated with PROJ-123?
Show me all cross-product connections for issue PROJ-5
```
Use `getTeamworkGraphContext` with the issue ARI or key, then call `getTeamworkGraphObject` on each returned ARI for full detail. Classic API tokens will receive a `403` — switch to OAuth or a fine-grained token.

## Method 2 — REST API Fallback

Use when MCP is not installed but you have API access.

### Custom Fields
```bash
curl -s -u email@example.com:API_TOKEN \
  "https://your-site.atlassian.net/rest/api/3/field" \
  | jq '.[] | select(.custom) | {name, id, schemaType: .schema.type}'
```

### Test JQL
```bash
curl -s -u email@example.com:API_TOKEN \
  "https://your-site.atlassian.net/rest/api/3/search?jql=$(echo 'project = PROJ' | jq -sRr @uri)&maxResults=3" \
  | jq '.issues[] | {key, summary: .fields.summary, status: .fields.status.name}'
```

### Issue Data
```bash
curl -s -u email@example.com:API_TOKEN \
  "https://your-site.atlassian.net/rest/api/3/issue/PROJ-123" \
  | jq '.fields | {summary, status, assignee, priority, customfields: [to_entries[] | select(.key | startswith("customfield")) | {key, value}]}'
```

### Workflow IDs
```bash
# Transition IDs (from any issue in the target workflow)
curl -s -u email@example.com:API_TOKEN \
  "https://your-site.atlassian.net/rest/api/3/issue/PROJ-1/transitions" \
  | jq '.transitions[] | {id, name}'

# Role IDs
curl -s -u email@example.com:API_TOKEN \
  "https://your-site.atlassian.net/rest/api/3/role" \
  | jq '.[] | {id, name}'

# Issue type IDs (project-specific, includes subtask flag)
curl -s -u email@example.com:API_TOKEN \
  "https://your-site.atlassian.net/rest/api/3/project/PROJ" \
  | jq '.issueTypes[] | {id, name, subtask}'

# Link type IDs
curl -s -u email@example.com:API_TOKEN \
  "https://your-site.atlassian.net/rest/api/3/issueLinkType" \
  | jq '.issueLinkTypes[] | {id, name: .outward}'
```

### Browser (No CLI needed)
- Custom fields: Jira Admin → Issues → Custom Fields
- Project issue types: Project Settings → Issue Types
- Workflow: Project Settings → Workflows
- Issue data: Browse any issue, click "..." → "View all fields" or use Developer Tools → Network tab → view `/rest/api/3/issue/{key}` response

## Method 3 — ScriptRunner Console Fallback

Use when you're already in the ScriptRunner environment. Open the ScriptRunner Console and run these Groovy scripts.

### Custom Fields
```groovy
// List custom fields
get("/rest/api/3/field").asObject(List).body.findAll { it.custom }.collect { [name: it.name, id: it.id, type: it.schema.type] }
```

### Test JQL
```groovy
// Test JQL query
def result = get("/rest/api/3/search?jql=project+%3D+PROJ&maxResults=3").asObject(Map).body
result.issues.each { issue ->
    println("${issue.key}: ${issue.fields.summary} [${issue.fields.status.name}]")
}
```

### Issue Data
```groovy
// Inspect all fields on an issue
def issue = get("/rest/api/3/issue/PROJ-123").asObject(Map).body
issue.fields.each { key, value ->
    println("$key = $value")
}
```

### Get Logged-in User
```groovy
// Find your own accountId
Users.getLoggedInUser()
```

### Available Projects
```groovy
// List project keys
get("/rest/api/3/project").asObject(List).body.collect { [key: it.key, name: it.name] }
```

### Workflow IDs
```groovy
// Transition IDs (from any issue in the target workflow)
get("/rest/api/3/issue/PROJ-1/transitions").asObject(Map).body.transitions.collect { [id: it.id, name: it.name] }

// Role IDs
get("/rest/api/3/role").asObject(List).body.collect { [id: it.id, name: it.name] }

// Issue type IDs for a project (subtask: true flags child issue types)
def proj = get("/rest/api/3/project/PROJ").asObject(Map).body
proj.issueTypes.collect { [id: it.id, name: it.name, subtask: it.subtask] }

// Link type IDs
get("/rest/api/3/issueLinkType").asObject(Map).body.issueLinkTypes.collect { [id: it.id, name: it.outward] }
```

## Atlassian Admin Discovery

Use when writing scripts that call the Atlassian Admin REST API (e.g. group membership writes, which are org-level and cannot be written via the Jira REST API).

### Org ID

Visible in the `admin.atlassian.com` URL path: `admin.atlassian.com/o/{orgId}/…`. Copy that UUID — it is the `orgId` used in all Admin API paths.

### Group UUID

The Jira REST API can read org-level groups even though the ADD_ON cannot write them. Use this to resolve a group name to its UUID:

```groovy
// ScriptRunner Console or post function
def groupId = get("/rest/api/3/group?groupname=my-group-name").asObject(Map).body?.groupId
```

The same UUID is valid in Atlassian Admin API paths (`/admin/v1/orgs/{orgId}/directory/groups/{groupId}/…`).

### Group membership writes

Writing group membership requires the Atlassian Admin v1 API with an **unscoped** admin API key stored in a Script Variable. See the "Group Management" section of the `scriptrunner-groovy` skill for the full implementation pattern.
