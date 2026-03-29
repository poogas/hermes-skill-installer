---
name: hermes-skill-installer
description: Install other Hermes skills directly from GitHub repositories. Usage: ask Tiese to add a skill, and she will push it to this repository. Then run `/skills install poogas/hermes-skill-installer/hermes-skill-installer` to make it available.
version: 1.0.0
author: poogas
license: MIT
metadata:
  hermes:
    tags: [skills, installer, plugin, github]
    platform: all
---

# Hermes Skill Installer

This is a meta-skill — it doesn't do anything itself. It's a repository where Tiese (AI assistant) stores new skills for Hermes Agent.

## How to Install a New Skill

1. Ask Tiese to create a skill for you
2. She will push the SKILL.md to this repository under `hermes-skill-installer/`
3. In Telegram (or any Hermes platform), run:
   ```
   /skills install poogas/hermes-skill-installer/hermes-skill-installer
   ```
4. The new skill will be available!

## How It Works

- Skills are stored as `SKILL.md` files inside subdirectories in this repository
- Hermes's built-in `/skills install` command pulls from GitHub
- No additional tools needed — just use Hermes's native skill system

## Repository Structure

```
hermes-skill-installer/
└── hermes-skill-installer/
    └── SKILL.md   ← This file (meta-skill describing the repo)
```

To add a new skill to this repo, simply ask Tiese to create one and push it here.
