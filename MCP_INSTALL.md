# Atlassian Rovo MCP Server — Installation Guide

This guide explains how to connect any MCP-compatible AI tool to the official Atlassian Rovo MCP server so you can query Jira, discover field IDs, inspect workflows, and test ScriptRunner scripts directly from your AI assistant.

Most clients use a **project-local config file** created in this repo directory. Cline and Windsurf use global config files stored in your home directory. Either way, config files are created during setup (not pre-existing) — each developer creates the file appropriate for their AI client.

---

## What You Get

Once connected, your AI tool can:

- Search Jira issues using JQL
- Retrieve individual issues and their custom field values
- List projects, boards, sprints, and epics
- Get custom field definitions and IDs (replaces manual API discovery)
- Fetch available workflow statuses and transition IDs
- Create and update issues, add comments, transition issue states
- Look up issue types, link types, and role IDs

All operations respect your existing Jira Cloud permissions.

---

## MCP Tool Categories

The Atlassian Rovo MCP exposes two distinct categories of tools. They have different capabilities and different token requirements:

**Standard Jira tools** — CRUD operations: search issues by JQL, get issue details, list projects and boards, add comments, transition issues, look up field/role/type IDs. Work with classic API tokens (if org API token auth is enabled) or OAuth.

**Teamwork Graph tools** (`getTeamworkGraphContext` / `getTeamworkGraphObject`) — relationship and connection queries across Atlassian products: issues linked to Confluence pages, pull requests, Loom videos, goals, teams, and third-party objects. Require **fine-grained (scoped) API tokens** or OAuth. Classic API tokens (`ATATT3x…` format) always return `403` for Graph tools.

| Use case | Tool category | Token requirement |
|----------|--------------|-------------------|
| JQL search, get issue, list projects, field IDs | Standard Jira tools | Classic or fine-grained or OAuth |
| Issue ↔ page, issue ↔ PR, cross-product relationships | Teamwork Graph tools | Fine-grained or OAuth only |

> **Rule:** Use standard Jira tools for anything described as "search", "get", "list", "create", or "update". Use Graph tools only when the question is about **connections between entities**.

---

## Universal Pattern

Every MCP client in this guide connects to the **same remote endpoint**. Only the config file format and location differ.

| Property | Value |
|----------|-------|
| Transport | Streamable HTTP (`/v1/mcp`) — Claude Code and OpenCode only |
| URL | `https://mcp.atlassian.com/v1/mcp` |
| Auth | OAuth 2.1 (recommended) or fine-grained API token with Basic auth |

> **Client-specific endpoints:** Claude Code and OpenCode use the new `/v1/mcp` HTTP endpoint. Other clients (Cline, VS Code, Cursor, Windsurf) continue using `/v1/sse` until the new endpoint is tested with them.

> **API token prerequisite:** If using API token auth, an org admin must enable it first at `admin.atlassian.com` → your org → **Rovo** → **Rovo MCP server** → Authentication → toggle **API token** on. The token itself (even a valid one) will be rejected until this setting is on.

The general approach is always:

1. **Create a config file** at the path specific to your client
2. **Restart or reload your client** so it picks up the new config
3. **Authenticate** (browser popup for OAuth, or insert a base64-encoded API token)
4. **Verify** by running a test command or asking a question

> **API Token Security Warning:** If you use an API token (instead of OAuth), your config file contains credentials. Ensure the file is in `.gitignore` so it is never committed. Configs using OAuth only are safe to commit. Files that may contain tokens:
> - `.mcp.json` — already in `.gitignore`
> - `.opencode/opencode.json` — add to `.gitignore` if using token
> - `.vscode/mcp.json` — only safe to commit if using OAuth
> - `.cursor/mcp.json` — add to `.gitignore` if using token
> - `.windsurf/mcp.json` — add to `.gitignore` if using token

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| MCP-compatible AI client | Claude Code, OpenCode, Cline, VS Code (Copilot/Cline/Continue), Cursor, Windsurf, or any SSE-capable MCP host |
| Atlassian Cloud account | Must have access to your Jira Cloud site |
| Internet access | Requires HTTPS to `https://mcp.atlassian.com` |

---

## Create an API Token (Optional — OAuth is simpler and works everywhere)

Use OAuth 2.1 via browser (automatic for most clients) for the simplest setup and full tool access. Use an API token only in headless environments (SSH-only servers, CI, clients without browser support).

### Token types and MCP compatibility

There are two types of Atlassian API tokens, and they are **not interchangeable** for MCP use:

| Token type | Format starts with | Standard Jira tools | Teamwork Graph tools |
|------------|--------------------|---------------------|---------------------|
| Classic API token | `ATATT3x…` | ✓ (if org setting enabled) | ✗ — always returns `403` |
| Fine-grained (scoped) API token | Different format | ✓ | ✓ |

**Classic tokens cannot be used for Teamwork Graph tools.** If you need Graph features (cross-product relationship queries), use OAuth or a fine-grained token.

### Create a fine-grained (scoped) API token

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token** → select **"Fine-grained API token"** (not Classic)
3. Enter a label (e.g., `Rovo MCP`)
4. Under **Select API token app**, choose **"Rovo MCP"** — this is the correct app for the Atlassian MCP server
5. On the scopes screen, **keep all scopes checked** (39 scopes are pre-selected). These cover the full range of what the Rovo MCP may call across Jira, Confluence, Bitbucket, Loom, Compass, and Teams. Deselecting any may cause silent failures if you later ask about those products.
6. Click **Create**, then **copy the token immediately** — it is shown only once

> If only "Classic API token" is offered (no fine-grained option), your org may not have fine-grained tokens enabled yet. In that case, use OAuth for full functionality — classic tokens will always fail for Teamwork Graph tools.

### Create a classic API token (Jira CRUD only)

If you only need standard Jira CRUD tools and do not need Teamwork Graph:

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token** → enter a label → click **Create**
3. Copy the token immediately — it is shown only once

Classic tokens work for standard Jira tools only (if the org API token auth setting is enabled).

### Build the Authorization header value

On Linux/macOS:
```bash
echo -n 'your-email@example.com:YOUR_API_TOKEN' | base64
```

On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('your-email@example.com:YOUR_API_TOKEN'))
```

The output is your `<base64-value>`. You'll insert it into a client-specific config below.

> Keep API tokens secret. Treat them like passwords — revoke immediately at the URL above if compromised. Never commit a token to git.

---

## Client Setup

> **Tested clients in this repo:** Only **Claude Code** and **OpenCode** have been verified end-to-end against the Atlassian Rovo MCP using this guide. The other client configurations (Cline, VS Code, Cursor, Windsurf, and the generic SSE entry) are based on each client's official MCP documentation but have **not** been tested here — they should work, but expect minor adjustments. If you successfully set up an untested client, the maintainers welcome a PR that confirms it.

Choose the section for your AI client and follow the steps.

---

### Claude Code

**Option A — Config file (recommended)**

**Step 1.** Create `.mcp.json` in the project root (the folder you open in Claude Code):

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

> If you plan to run **two different Atlassian sites from two separate folders** using this same endpoint URL, add a differentiating query param to one entry's URL (e.g. `https://mcp.atlassian.com/v1/mcp?site=second`) so each gets its own OAuth token. See [Troubleshooting](#troubleshooting) — *Both folders/sites connect to the same Atlassian site despite separate configs*.

> The `"type"` field is required. Without it, Claude Code defaults to stdio transport and rejects the config with `command: expected string, received undefined`. Use `"http"` for the `/v1/mcp` streamable HTTP endpoint.

**Step 2.** Restart Claude Code (fully quit and reopen — config is only read on startup).

**Step 3.** On first launch with the new config, Claude Code will prompt you to trust the `atlassian` MCP server's tools. Confirm to allow it.

**Step 4.** On your first Jira query, a browser window opens for OAuth sign-in with your Atlassian account. Sign in and grant access. The token is stored — you won't be prompted again.

> If your site uses **custom domains** (Jira and Confluence may resolve to different URLs like `jira.example.com` vs `confluence.example.com`), the consent screen will not let you select all apps at once. Pick **one app** and the matching site URL; use a separate MCP server entry for the other app. See [Troubleshooting](#troubleshooting) — *OAuth fails when selecting multiple apps on a custom-domain site*.

**Option B — CLI only (no file needed)**

Instead of creating the file, run:

```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp
```

Then restart Claude Code and follow steps 3–4 above.

**With API token (instead of OAuth):** Use `.mcp.json` (already in `.gitignore`) — same file as Option A, just add a `headers` block:

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp",
      "headers": {
        "Authorization": "Basic <base64-value>"
      }
    }
  }
}
```

> **API token auth requires an org admin to enable it first.** Go to `admin.atlassian.com` → your org → **Rovo** → **Rovo MCP server** → Authentication → toggle **API token** on. Without this, you'll get a `"You don't have permission to connect via API token"` error even with a valid token.

**Verify:**

```bash
claude mcp list
```

`atlassian` should appear in the list. Then start Claude Code in this project directory and type `/mcp` — `atlassian` should appear as **connected**.

---

### OpenCode

**Step 1.** Create the `.opencode` directory in the project root if it doesn't exist:

```bash
# macOS/Linux
mkdir -p .opencode

# Windows (PowerShell)
mkdir .opencode
```

**Step 2.** Create `.opencode/opencode.json`:

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

**Step 3.** Restart OpenCode. It auto-discovers the config on startup.

**Step 4.** On your first Jira query, a browser window opens for OAuth sign-in. Sign in and grant access. The token is stored — you won't be prompted again.

**Verify:**

```bash
opencode mcp list
```

`atlassian` should appear as enabled. Then run a test prompt (see [Verify & Test](#verify--test) below).

**With API token (instead of OAuth):**

Add `"oauth": false` and a `"headers"` block to `.opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "atlassian": {
      "type": "remote",
      "url": "https://mcp.atlassian.com/v1/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Basic <base64-value>"
      },
      "oauth": false
    }
  }
}
```

> If using an API token, note that the `.opencode/` directory is already in `.gitignore` in this repo, so the token file is not exposed. Verify the same for any other repo where you copy this config.

**Optional — manage authentication manually:**

These commands are only needed if the OAuth flow doesn't trigger automatically or you need to reset credentials.

```bash
opencode mcp auth atlassian    # Trigger OAuth manually
opencode mcp list              # List servers and auth status
opencode mcp logout atlassian  # Remove stored credentials
opencode mcp debug atlassian   # Debug connection issues
```

---

### Cline

**Step 1.** Create the config file for your setup:

**CLI (all platforms):** `~/.cline/mcp.json` (Unix/macOS) or `%USERPROFILE%\.cline\mcp.json` (Windows):

```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/sse",
      "disabled": false
    }
  }
}
```

**VS Code extension:** Open the Cline panel, click the **MCP Servers** icon, go to the **Configure** tab, click **Configure MCP Servers**, and paste into the settings JSON editor:

```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/sse",
      "disabled": false
    }
  }
}
```

**Step 2.** Restart or reload Cline for the config to take effect.

**Step 3.** On your first Jira query, a browser window opens for Atlassian OAuth sign-in. Grant access — the token is stored and you won't be prompted again.

**With API token (instead of OAuth):**

```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/sse",
      "disabled": false,
      "headers": {
        "Authorization": "Basic <base64-value>"
      }
    }
  }
}
```

**Verify:**

```bash
cline config mcp
```

`atlassian` should appear in the output. Then run a test prompt (see Verify & Test below).

---

### VS Code (GitHub Copilot 1.99+)

**Step 1.** Create `.vscode/mcp.json` at the project root (VS Code uses a different key structure):

```json
{
  "servers": {
    "atlassian": {
      "type": "sse",
      "url": "https://mcp.atlassian.com/v1/sse"
    }
  }
}
```

**Step 2.** Reload VS Code (`Developer: Reload Window`). The server will appear in the MCP panel (GitHub Copilot Chat → the plug icon or `@` menu → MCP Servers).

**Step 3.** On your first Jira query, a browser window opens for Atlassian OAuth sign-in. Grant access — the token is stored and you won't be prompted again.

**With API token (instead of OAuth):**

```json
{
  "servers": {
    "atlassian": {
      "type": "sse",
      "url": "https://mcp.atlassian.com/v1/sse",
      "headers": {
        "Authorization": "Basic <base64-value>"
      }
    }
  }
}
```

> `.vscode/mcp.json` can be committed if you want to share the config with teammates. It contains no secrets when using OAuth.

**Verify:** In the Copilot Chat panel, click the MCP Servers icon — `atlassian` should appear as connected. Then run a test prompt (see Verify & Test below).

---

### Cursor

**Step 1.** Create `.cursor/mcp.json` at the project root:

```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/sse",
      "transport": "sse"
    }
  }
}
```

**Step 2.** Restart Cursor. The server will appear in the MCP panel (Settings → Features → MCP, or the MCP tab in the Cursor sidebar).

**Step 3.** On your first Jira query, a browser window opens for Atlassian OAuth sign-in. Grant access — the token is stored and you won't be prompted again.

**With API token (instead of OAuth):**

```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Basic <base64-value>"
      }
    }
  }
}
```

> If using an API token, add `.cursor/mcp.json` to `.gitignore`.

**Verify:** In Cursor's MCP panel, `atlassian` should appear as enabled. Then run a test prompt (see Verify & Test below).

---

### Windsurf

Windsurf's official MCP config lives at a **global** path. A project-local file is also shown for consistency with other clients, but the global config is the recommended and most reliable approach.

**Recommended — global config (all platforms):**

Create or edit `~/.codeium/windsurf/mcp_config.json` (Unix/macOS) or `%USERPROFILE%\.codeium\windsurf\mcp_config.json` (Windows):

```json
{
  "mcpServers": {
    "atlassian": {
      "serverUrl": "https://mcp.atlassian.com/v1/sse"
    }
  }
}
```

Restart Windsurf to pick up the config.

On your first Jira query, a browser window opens for Atlassian OAuth sign-in. Grant access — the token is stored and you won't be prompted again.

**Verify:** In Windsurf's MCP panel, `atlassian` should appear as enabled. Then run a test prompt (see Verify & Test below).

**Alternative — project-local config (may not work in all Windsurf versions):**

Create `.windsurf/mcp.json` at the project root:

```json
{
  "mcpServers": {
    "atlassian": {
      "serverUrl": "https://mcp.atlassian.com/v1/sse"
    }
  }
}
```

**With API token (recommended: use environment variable):**

Windsurf supports `${env:VAR_NAME}` interpolation for secrets, avoiding hardcoded tokens:

```json
{
  "mcpServers": {
    "atlassian": {
      "serverUrl": "https://mcp.atlassian.com/v1/sse",
      "headers": {
        "Authorization": "Basic ${env:ATLASSIAN_MCP_TOKEN}"
      }
    }
  }
}
```

Set the environment variable `ATLASSIAN_MCP_TOKEN` to your `<base64-value>` before starting Windsurf:

```bash
# macOS/Linux
export ATLASSIAN_MCP_TOKEN="<base64-value>"
```

```powershell
# Windows (PowerShell — current session only)
$env:ATLASSIAN_MCP_TOKEN = "<base64-value>"
# To persist across sessions: System Properties → Advanced → Environment Variables
```

Alternatively, hardcode the value directly in the config:

```json
{
  "mcpServers": {
    "atlassian": {
      "serverUrl": "https://mcp.atlassian.com/v1/sse",
      "headers": {
        "Authorization": "Basic <base64-value>"
      }
    }
  }
}
```

> If using a project-local file with a hardcoded token, add `.windsurf/mcp.json` to `.gitignore`.

---

### Generic / Any SSE-Compatible MCP Client

If your client is not listed above, configure it with:

- **URL:** `https://mcp.atlassian.com/v1/sse`
- **Transport:** SSE
- **Auth:** OAuth 2.1 (browser) or `Authorization: Basic <base64-value>` header

---

## Verify & Test

Once configured, ask your AI assistant (replace `KEY` with your actual Jira project key, e.g. `MYPROJECT`):

```
List the 5 most recently updated issues in my project using JQL:
project = KEY ORDER BY updated DESC
```

If results return, the MCP is working. If you get "project not found", verify that `KEY` matches a project you have access to in Jira.

**Per-client verification commands:**

| Client | Command |
|--------|---------|
| Claude Code | `claude mcp list`, then `/mcp` inside Claude Code |
| OpenCode | `opencode mcp list` |
| Cline | `cline config mcp` |
| VS Code | MCP Servers panel in GitHub Copilot Chat |
| Cursor | Settings → Features → MCP |
| Windsurf | MCP panel in Windsurf settings |

---

## Using with ScriptRunner

After installing, you can replace many manual discovery steps with direct prompts:

| Task | What to ask your AI assistant |
|------|--------------------|
| Find a custom field ID | "What is the field ID for the 'Customer Type' field in Jira?" |
| Test a JQL query | "Run this JQL and show me the first 5 results: project = KEY AND issuetype = Bug" |
| Get workflow transitions | "What are the available workflow transitions for issue KEY-123?" |
| Discover issue type IDs | "List all issue types in project KEY with their IDs" |
| Look up role IDs | "What are the project role IDs for project KEY?" |
| Check link types | "List all issue link types available in this Jira instance" |

---

## Troubleshooting

**Server configured but not connecting:**
Restart your client — most tools reload MCP config only on startup. For VS Code, run `Developer: Reload Window`.

**MCP tools not appearing in the client panel:**
Check if the server is enabled in your client's MCP settings. Some clients (OpenCode, Cline) allow per-server enable/disable toggles.

**Connection timeout:**
Ensure your network/firewall allows HTTPS connections to `https://mcp.atlassian.com`. Corporate proxies may need configuration.

**Authentication keeps prompting (OAuth):**
Remove and re-add the server in your client to trigger a fresh OAuth flow. For Claude Code: `claude mcp remove atlassian`, then `claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp`. For OpenCode: `opencode mcp logout atlassian && opencode mcp auth atlassian`.

**OAuth fails when selecting multiple apps on a custom-domain site:**
This only affects sites where **custom domains** are configured; sites using the default `*.atlassian.net` URL are unaffected. On such sites, Jira and Confluence may resolve to different custom-domain URLs (e.g. `jira.example.com` vs `confluence.example.com`), so no single entry in the OAuth "Choose a site" list covers both apps — selecting both causes authentication to fail. At the consent screen, pick **one app** and the site URL matching that app's domain. To use a second app on the same site, add a separate MCP server entry with a different name, authenticate it independently, and select that app's domain at its own consent screen.

**Both folders/sites connect to the same Atlassian site despite separate configs:**
This only happens when two MCP server entries point at the **same** endpoint URL (e.g. two folders both configured with `https://mcp.atlassian.com/v1/mcp` to reach different Atlassian sites). The OAuth credential is keyed by the server URL origin, so both entries share one token — the second authentication overwrites the first, and both folders end up connected to whichever site was authenticated last. Fix: keep one entry on the plain URL and give the other a differentiating query param (e.g. `https://mcp.atlassian.com/v1/mcp?site=second`). The param does **not** change which site you connect to (that is chosen at the consent screen) — it only forces a separate token store. Authenticate each folder independently. To verify isolation, from each folder ask the assistant to call `getAccessibleAtlassianResources` and confirm each returns a different `cloudId`; for a stronger check, run a JQL search for content that exists only on one site. Note that `getAccessibleAtlassianResources` may list every site the account can reach, so the `cloudId` actually hit by real queries is the definitive test — not the resource list alone.

**"Permission denied" on Jira queries:**
The MCP server uses your Atlassian account's existing permissions. If you cannot see a project in Jira, the MCP will not return data from it either.

**"403 — Legacy API tokens without scopes are not supported" (Teamwork Graph):**
Classic API tokens (`ATATT3x…` format) cannot be used with Teamwork Graph tools — this is a hard restriction, not a configuration issue. The fix is: (a) switch to OAuth by removing the `headers` block from your config, or (b) replace the classic token with a fine-grained (scoped) API token that has the required Rovo/Teamwork scopes.

**"You don't have permission to connect via API token":**
API token authentication is disabled by default at the org level. An org admin must enable it at `admin.atlassian.com` → your org → **Rovo** → **Rovo MCP server** → Authentication → toggle **API token** on. The token itself may be valid (you can verify it against the Jira REST API), but the MCP server rejects it until this setting is on. Note: this is an org-level setting, not site-level — you must be at `admin.atlassian.com`, not your site admin panel.

**API token not working (after org setting is enabled):**
Verify the base64 encoding includes both email and token separated by a colon (`email:token`) with no extra whitespace or newlines in the result.

**Config file changes not picked up:**
Most clients read MCP config only at startup. Fully quit and restart the client, not just reload the window.

**SSE endpoint deprecation:**
The `/v1/sse` endpoint is planned for retirement after 30 June 2026. Claude Code uses `"type": "http"` and OpenCode uses `"type": "remote"` with the new `https://mcp.atlassian.com/v1/mcp` endpoint. Other clients will migrate once testing is complete.

**JSON syntax error in config file:**
If the client silently fails to load MCP on startup, check your config file for trailing commas, missing braces, or incorrect quoting. Paste the file into a JSON validator (e.g., `jsonlint.com`) to check.

**Trust prompt not appearing in Claude Code:**
If Claude Code doesn't prompt you to trust the server, run `claude mcp list` to confirm the server is registered, then fully quit and reopen Claude Code (not just reload the window).

---

## Re-installing on a New Machine

MCP config files are **not committed** to the repo (except `.vscode/mcp.json` which is safe to commit with OAuth). When cloning to a new machine:

1. Re-create the config file for your client using the instructions above
2. Authenticate again (OAuth or API token)
3. Verify with the test prompt

Each developer creates their own config — credentials are never stored in the repo.

---

## Quick Reference

| Client | Config File | Top-Level Key | Auth Method | Verify Command | Tested |
|--------|------------|---------------|-------------|----------------|--------|
| **Claude Code** | `.mcp.json` (project root) | `mcpServers` | OAuth / Basic header | `claude mcp list` | ✅ |
| **OpenCode** | `.opencode/opencode.json` (project root) | `mcp` | OAuth auto / Basic header | `opencode mcp list` | ✅ |
| **Cline** | `~/.cline/mcp.json` (global) | `mcpServers` | OAuth / Basic header | `cline config mcp` | ⚠️ |
| **VS Code** | `.vscode/mcp.json` (project root) | `servers` | OAuth / Basic header | MCP panel | ⚠️ |
| **Cursor** | `.cursor/mcp.json` (project root) | `mcpServers` | OAuth / Basic header | MCP panel | ⚠️ |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` (global) | `mcpServers` | OAuth / Basic / env var | MCP panel | ⚠️ |

> ✅ verified end-to-end in this repo · ⚠️ configured from official docs, not verified here
