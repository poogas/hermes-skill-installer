# Hermes Skills MCP Server

Full MCP wrapper around `hermes skills` CLI commands. Enables Hermes Agent to search, list, install, info, and remove skills — even from an isolated container.

## Why

Hermes Agent runs in a container but `hermes` CLI lives on the host. This MCP server acts as a bridge — Hermes calls tools, this server executes `hermes skills ...` on the host.

## Installation

### Add to Hermes config

Edit `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  skills:
    command: "npx"
    args: ["-y", "poogas/hermes-skill-installer"]
```

Then restart Hermes: `hermes gateway restart`

Or use the hot-reload command: `/reload_mcp`

## Available Tools

| Tool | Description |
|------|-------------|
| `skill_install` | Install a skill from GitHub or Skills Hub |
| `skill_search` | Search skills in Hermes Skills Hub (skills.sh) |
| `skill_list` | List installed skills (local, hub, or all) |
| `skill_info` | Get detailed info about a specific skill |
| `skill_remove` | Remove an installed skill |

### skill_install
```json
{ "identifier": "fishaudio/fish-speech", "force": false }
```
- `identifier`: Format `owner/repo/path` for GitHub, or just `owner/skill-name` for hub
- `force`: Skip confirmation and overwrite existing (default: false)

### skill_search
```json
{ "query": "fish audio tts", "limit": 10 }
```
- `query`: Search terms
- `limit`: Max results (default: 10)

### skill_list
```json
{ "source": "all" }
```
- `source`: "all", "local", or "hub" (default: all)

### skill_info
```json
{ "identifier": "fishaudio/fish-speech" }
```

### skill_remove
```json
{ "name": "fish-speech", "confirm": false }
```
- `confirm`: Skip prompt (default: false)

## Example Usage

```
Find me a fish audio skill
→ skill_search("fish audio")

Install it
→ skill_install("fishaudio/fish-speech")

List all my skills
→ skill_list()

Get info on a skill
→ skill_info("fishaudio/fish-speech")

Remove a skill
→ skill_remove("old-skill")
```

## Repository Structure

```
hermes-skill-installer/
├── README.md
├── hermes-skill-installer.js  ← Node.js MCP server
├── package.json
└── hermes-skill-installer/    ← SKILL.md meta
```

## Requirements

- Node.js (for npx)
- Hermes Agent on host
- `mcp` package: `pip install mcp`
