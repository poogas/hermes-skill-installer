#!/usr/bin/env node
/**
 * Hermes Skills MCP Server
 * 
 * Full wrapper around `hermes skills` CLI commands.
 * Provides tools: install, search, list, info, remove
 * 
 * Install with:
 *   npx -y poogas/hermes-skill-installer
 * 
 * Or add to Hermes:
 *   hermes mcp add skills --command=npx --args="-y poogas/hermes-skill-installer"
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { spawn } = require('child_process');
const os = require('os');

const TOOLS = [
  {
    name: "skill_install",
    description: "Install a Hermes skill from GitHub repository or Skills Hub",
    inputSchema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "Skill identifier: 'owner/repo/path' for GitHub, or 'owner/skill-name' for hub, e.g. 'fishaudio/fish-speech'"
        },
        force: {
          type: "boolean",
          description: "Force reinstall if skill already exists",
          default: false
        }
      },
      required: ["identifier"]
    }
  },
  {
    name: "skill_search",
    description: "Search for skills in Hermes Skills Hub (skills.sh)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find skills in the hub"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          default: 10
        }
      },
      required: ["query"]
    }
  },
  {
    name: "skill_list",
    description: "List installed Hermes skills",
    inputSchema: {
      type: "object",
      properties: {
        source: {
          type: "string",
          enum: ["all", "local", "hub"],
          description: "Source to list from: 'all' (default), 'local', or 'hub'",
          default: "all"
        }
      }
    }
  },
  {
    name: "skill_info",
    description: "Get detailed information about a specific skill",
    inputSchema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "Skill identifier: 'owner/repo/path' for GitHub, or skill name for local"
        }
      },
      required: ["identifier"]
    }
  },
  {
    name: "skill_remove",
    description: "Remove an installed Hermes skill",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Skill name to remove"
        },
        confirm: {
          type: "boolean",
          description: "Skip confirmation prompt",
          default: false
        }
      },
      required: ["name"]
    }
  }
];

class HermesSkillsServer {
  constructor() {
    this.server = new Server(
      {
        name: "hermes-skills",
        version: "1.1.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: TOOLS };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "skill_install":
            return await this.skillInstall(args);
          case "skill_search":
            return await this.skillSearch(args);
          case "skill_list":
            return await this.skillList(args);
          case "skill_info":
            return await this.skillInfo(args);
          case "skill_remove":
            return await this.skillRemove(args);
          default:
            return {
              content: [{ type: "text", text: `Unknown tool: ${name}` }],
              isError: true
            };
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  runCommand(cmd, args, timeout = 120000) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, {
        cwd: os.homedir(),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });

      proc.on('error', (err) => {
        reject(err);
      });

      setTimeout(() => {
        proc.kill();
        reject(new Error('Command timed out'));
      }, timeout);
    });
  }

  async skillInstall(args) {
    const { identifier, force = false } = args;

    if (!identifier) {
      return {
        content: [{ type: "text", text: "Error: identifier is required" }],
        isError: true
      };
    }

    const cmdArgs = ["skills", "install", identifier];
    if (force) cmdArgs.push("--force");

    try {
      const result = await this.runCommand('hermes', cmdArgs);

      if (result.code === 0) {
        return {
          content: [{ type: "text", text: result.stdout || "Skill installed successfully!" }]
        };
      } else {
        return {
          content: [{ type: "text", text: `Error:\n${result.stderr || result.stdout}` }],
          isError: true
        };
      }
    } catch (error) {
      if (error.message.includes('ENOENT')) {
        return {
          content: [{ type: "text", text: "Error: 'hermes' command not found. Is Hermes installed?" }],
          isError: true
        };
      }
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  async skillSearch(args) {
    const { query, limit = 10 } = args;

    if (!query) {
      return {
        content: [{ type: "text", text: "Error: query is required" }],
        isError: true
      };
    }

    try {
      const result = await this.runCommand('hermes', ['skills', 'search', query]);

      if (result.code === 0) {
        // Parse and limit results
        const lines = (result.stdout || '').trim().split('\n').slice(0, limit);
        return {
          content: [{ type: "text", text: lines.join('\n') || "No results found" }]
        };
      } else {
        return {
          content: [{ type: "text", text: `Error:\n${result.stderr || result.stdout}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  async skillList(args) {
    const { source = "all" } = args;

    const cmdArgs = ["skills", "list"];
    if (source === "hub") {
      cmdArgs.push("--source");
      cmdArgs.push("hub");
    } else if (source === "local") {
      cmdArgs.push("--source");
      cmdArgs.push("local");
    }

    try {
      const result = await this.runCommand('hermes', cmdArgs);

      if (result.code === 0) {
        return {
          content: [{ type: "text", text: result.stdout || "No skills found" }]
        };
      } else {
        return {
          content: [{ type: "text", text: `Error:\n${result.stderr || result.stdout}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  async skillInfo(args) {
    const { identifier } = args;

    if (!identifier) {
      return {
        content: [{ type: "text", text: "Error: identifier is required" }],
        isError: true
      };
    }

    try {
      const result = await this.runCommand('hermes', ['skills', 'info', identifier]);

      if (result.code === 0) {
        return {
          content: [{ type: "text", text: result.stdout || "No info available" }]
        };
      } else {
        return {
          content: [{ type: "text", text: `Error:\n${result.stderr || result.stdout}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  async skillRemove(args) {
    const { name, confirm = false } = args;

    if (!name) {
      return {
        content: [{ type: "text", text: "Error: name is required" }],
        isError: true
      };
    }

    const cmdArgs = ["skills", "remove", name];
    if (confirm) cmdArgs.push("--yes");

    try {
      const result = await this.runCommand('hermes', cmdArgs);

      if (result.code === 0) {
        return {
          content: [{ type: "text", text: result.stdout || "Skill removed successfully!" }]
        };
      } else {
        return {
          content: [{ type: "text", text: `Error:\n${result.stderr || result.stdout}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Hermes Skills MCP Server started");
  }
}

const server = new HermesSkillsServer();
server.start().catch(console.error);
