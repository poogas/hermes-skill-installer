# Hermes Skill Installer MCP Plugin

An MCP server plugin that allows Hermes Agent to install skills from GitHub directly.

## What This Does

Normally, Hermes Agent (running in a container/Docker) cannot run `hermes skills install` on the host machine. This MCP server bridges that gap — Hermes can call the `skill_install` tool, and this server executes `hermes skills install` on the host.

## Installation

### 1. Install MCP package (if not already installed)

```bash
pip install mcp
```

### 2. Add to Hermes config

Edit `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  skill-installer:
    command: python
    args: ["/path/to/skill_installer_mcp.py"]
```

Replace `/path/to/` with the actual path where you placed this file.

### 3. Restart Hermes

```bash
hermes gateway restart
```

## Available Tools

Once installed, Hermes will have access to these tools:

- **`skill_install`** — Install a skill from GitHub
  - `identifier`: Format `owner/repo/path` (e.g., `poogas/hermes-skill-installer/hermes-skill-installer`)
  - `force`: Reinstall if already installed (default: false)

- **`skill_list`** — List all installed skills

- **`skill_search`** — Search for skills in the Hermes Skills Hub

## Usage

After installation, you can ask Tiese (or any Hermes instance with this plugin):

```
Install the github-pr-workflow skill
```

And Hermes will use the `skill_install` tool to run:
```bash
hermes skills install poogas/hermes-skill-installer/github-pr-workflow
```

## Repository Structure

```
hermes-skill-installer/
├── README.md              ← You are here
├── skill_installer_mcp.py ← MCP server plugin
└── hermes-skill-installer/
    └── SKILL.md           ← Meta-skill (for reference)
```

## Requirements

- Python 3.9+
- `mcp` package: `pip install mcp`
- Hermes Agent installed on the host
