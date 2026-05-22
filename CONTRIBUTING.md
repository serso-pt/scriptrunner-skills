# Contributing to ScriptRunner Skills

Thanks for your interest in contributing! This repo provides AI agent skills for ScriptRunner Cloud development.

## Ways to Contribute

- **New skills** — add support for additional ScriptRunner features or Atlassian products
- **Improvements** — fix gaps in existing skills (missing patterns, wrong API references, edge cases)
- **Docs** — improve installation guides, fix typos, add client-specific instructions
- **MCP client verification** — confirm the `MCP_INSTALL.md` setup for an untested client (Cline, VS Code, Cursor, Windsurf) and submit a PR marking it verified

## Adding a New Skill

> **Tip:** You don't have to write `SKILL.md` from scratch. Many AI agents can scaffold the frontmatter and section structure below — for example, a "skill-creator" skill, or simply asking your agent to draft a `SKILL.md` from this guide. Treat the result as a starting point: it must still follow the conventions here, especially the `scriptrunner-` name prefix and the `"Use when…"` description convention.

### 1. Create the skill directory

```
skills/scriptrunner-<feature>/
  SKILL.md
```

### 2. SKILL.md structure

A skill file is YAML frontmatter followed by Markdown. A typical structure (adapt sections to fit the skill):

```markdown
---
name: scriptrunner-<feature>
description: Use when [trigger condition]...
---

# Skill Title

## Overview

One paragraph explaining what this skill covers and when it applies.

## Quick Reference

| API / Concept | Purpose |
|---------------|---------|
| ... | ... |

## [Main Sections]

Detailed guidance with code examples. Organize by concept, not by feature.

## Patterns

Frequently used code snippets with explanations.

## Common Mistakes

Common errors and how to fix them.
```

Sections are a guideline — adapt the structure to fit how the skill is best organised.

**Frontmatter rules:**
- `name` — **must start with `scriptrunner-`**, lowercase, hyphenated, matching the directory name (e.g. `scriptrunner-groovy`, `scriptrunner-behaviours`)
- `description` — starts with `"Use when…"` so agents know when to load it (e.g. "Use when a user asks to…" or "Use when a user needs to…"). Include trigger keywords (API names, feature names, file types)

### 3. Content guidelines

- Write for AI agents, not humans — be explicit and unambiguous
- Include complete code examples (no "..." or "TODO")
- Show the correct import statements and API signatures
- Document common mistakes and anti-patterns
- Reference official Adaptavist docs where helpful, but the skill must be self-contained

### 4. Test your skill

Install locally via symlink to verify the skill loads and triggers correctly:

**OpenCode:**
```bash
# Clone your fork
git clone <your-fork-url> ~/scriptrunner-skills-dev

# Symlink into OpenCode skills
# macOS/Linux
ln -s ~/scriptrunner-skills-dev/skills/scriptrunner-<feature> ~/.config/opencode/skills/

# Windows (PowerShell, admin)
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.config\opencode\skills\scriptrunner-<feature>" `
  -Target "$env:USERPROFILE\scriptrunner-skills-dev\skills\scriptrunner-<feature>"
```

**Claude Code:**
```bash
# macOS/Linux
ln -s ~/scriptrunner-skills-dev/skills/scriptrunner-<feature> ~/.claude/skills/

# Windows (PowerShell, admin)
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.claude\skills\scriptrunner-<feature>" `
  -Target "$env:USERPROFILE\scriptrunner-skills-dev\skills\scriptrunner-<feature>"
```

**Codex / Gemini CLI:** Use the equivalent skills directory from the README (`~/.codex/skills`, `~/.gemini/skills`).

Restart your agent. Ask a question that should trigger the skill. Verify it loads and produces correct output.

### 5. Submit a PR

1. Fork the repo
2. Create a branch: `git checkout -b add-scriptrunner-<feature>`
3. Commit your changes with a descriptive message
4. Open a PR against `main`

**PR checklist:**
- [ ] Skill name starts with `scriptrunner-` and matches the directory name
- [ ] SKILL.md has valid frontmatter (`name`, `description`)
- [ ] Description starts with "Use when..." trigger phrase
- [ ] Code examples are complete (no placeholders)
- [ ] Tested locally via symlink install
- [ ] README.md updated if adding a new skill (add to the Skills table)

## Improving Existing Skills

- Open an issue first for large changes to discuss the approach
- Small fixes (typos, missing patterns, wrong API) — just open a PR
- Keep changes focused — one improvement per PR

## Contributing to MCP_INSTALL.md

`MCP_INSTALL.md` documents how to connect AI clients to the Atlassian Rovo MCP server. Only **Claude Code** and **OpenCode** have been verified end-to-end. The following clients are configured from official docs but unverified (marked ⚠️):

- Cline
- VS Code (GitHub Copilot 1.99+)
- Cursor
- Windsurf

To verify an untested client:

1. Follow its setup section in `MCP_INSTALL.md` exactly.
2. Run the Verify & Test prompt from that file (`List the 5 most recently updated issues…`). Confirm real Jira data is returned.
3. Note any steps that needed adjustment and update the relevant section.
4. In the Quick Reference table at the bottom of `MCP_INSTALL.md`, change the client's status from ⚠️ to ✅ and update the tested note.
5. Open a PR — no new skill files needed, just the `MCP_INSTALL.md` edit.

Keep the ✅ / ⚠️ legend consistent: ✅ means verified end-to-end in this repo, ⚠️ means configured from official docs but not verified here.

## Reporting Issues

- Use GitHub Issues for bugs, missing patterns, or incorrect guidance
- Include: which skill, what the agent did wrong, what it should have done
- If possible, include the agent's output and your Jira version

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
