# ScriptRunner Skills for AI Coding Agents

Agent skills for ScriptRunner Cloud development — Groovy scripting (HAPI API), TypeScript behaviours, and Jira instance discovery.

Works with Claude Code, Codex, Gemini CLI, and OpenCode.

## Skills

| Skill | Description |
|-------|-------------|
| [scriptrunner-groovy](skills/scriptrunner-groovy/SKILL.md) | Write/refactor Groovy scripts for listeners, script fields, jobs, escalation services, workflow post functions, conditions, validators, and additional scripts — including group management via the Atlassian Admin API |
| [scriptrunner-behaviours](skills/scriptrunner-behaviours/SKILL.md) | Write/refactor TypeScript behaviours for field visibility, validation, and template pre-filling |
| [scriptrunner-discovery](skills/scriptrunner-discovery/SKILL.md) | Discover Jira field IDs, test JQL queries, inspect issue data structures, look up workflow IDs (transition, role, issue type, link type), and resolve Atlassian Admin org/group IDs |

## Installation

### OpenCode (native)

```bash
git clone https://github.com/serso-pt/scriptrunner-skills ~/.config/opencode/skills/scriptrunner-skills
```

On Windows (PowerShell):

```powershell
git clone https://github.com/serso-pt/scriptrunner-skills "$env:USERPROFILE\.config\opencode\skills\scriptrunner-skills"
```

Skills are auto-discovered after restart.

### Claude Code

```bash
git clone https://github.com/serso-pt/scriptrunner-skills ~/scriptrunner-skills

mkdir -p ~/.claude/skills
ln -s ~/scriptrunner-skills/skills/scriptrunner-groovy ~/.claude/skills/
ln -s ~/scriptrunner-skills/skills/scriptrunner-behaviours ~/.claude/skills/
ln -s ~/scriptrunner-skills/skills/scriptrunner-discovery ~/.claude/skills/
```

On Windows (PowerShell, admin):

```powershell
$repo = "$env:USERPROFILE\scriptrunner-skills"
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\scriptrunner-groovy" -Target "$repo\skills\scriptrunner-groovy"
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\scriptrunner-behaviours" -Target "$repo\skills\scriptrunner-behaviours"
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\scriptrunner-discovery" -Target "$repo\skills\scriptrunner-discovery"
```

### Codex

```bash
git clone https://github.com/serso-pt/scriptrunner-skills ~/scriptrunner-skills

mkdir -p ~/.codex/skills
ln -s ~/scriptrunner-skills/skills/scriptrunner-groovy ~/.codex/skills/
ln -s ~/scriptrunner-skills/skills/scriptrunner-behaviours ~/.codex/skills/
ln -s ~/scriptrunner-skills/skills/scriptrunner-discovery ~/.codex/skills/
```

### Gemini CLI

```bash
git clone https://github.com/serso-pt/scriptrunner-skills ~/scriptrunner-skills

mkdir -p ~/.gemini/skills
ln -s ~/scriptrunner-skills/skills/scriptrunner-groovy ~/.gemini/skills/
ln -s ~/scriptrunner-skills/skills/scriptrunner-behaviours ~/.gemini/skills/
ln -s ~/scriptrunner-skills/skills/scriptrunner-discovery ~/.gemini/skills/
```

### Usage

After installation, restart your agent. Skills are auto-discovered — just describe your task and the agent will load the relevant skill.

## Examples

See [examples/](examples/) for a minimal ScriptRunner Cloud project with sample configurations:

- `extensions.yaml` — configuration for all feature types
- `groovy/CommentOnCreate.groovy` — listener script using HAPI API
- `typescript/bugDescriptionTemplate.ts` — behaviour pre-filling a bug report template on empty description

## Atlassian MCP (Optional)

The [Atlassian Rovo MCP server](https://mcp.atlassian.com) lets your AI agent query Jira directly — discover field IDs, test JQL, fetch workflow transitions, inspect issue data, and more. The `scriptrunner-discovery` skill prefers MCP when it's available and falls back to the REST API or the ScriptRunner Console when it isn't.

See [MCP_INSTALL.md](MCP_INSTALL.md) for full setup instructions covering Claude Code, OpenCode, Cline, VS Code, Cursor, and Windsurf.

## Prerequisites

- A ScriptRunner Cloud-enabled Jira instance
- For `scriptrunner-discovery` Method 1 (preferred): Atlassian MCP server — see [Atlassian MCP](#atlassian-mcp-optional)
- For `scriptrunner-discovery` Method 2: Jira API token (REST fallback)
- For `scriptrunner-discovery` Method 3: ScriptRunner Console access (no API token needed)
- For deployment: JDK 17+ and the [ScriptRunner Dev & Deployment Tool](https://docs.adaptavist.com/sms/latest/scriptrunner-dev-and-deployment-tool)

## Contributing

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for how to add or improve skills. This project follows our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT
