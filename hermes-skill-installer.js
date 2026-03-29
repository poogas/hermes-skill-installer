#!/usr/bin/env node
/**
 * Hermes Skill Installer MCP Server (Node.js with @modelcontextprotocol/sdk)
 * 
 * Install with:
 *   npx -y poogas/hermes-skill-installer
 * 
 * Or add to Hermes:
 *   hermes mcp add skill-installer --command=npx --args="-y poogas/hermes-skill-installer"
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { spawn } = require('child_process');
const os = require('os');

const TOOLS = [
  {
    name: "skill_install",
    description: "Install a Hermes skill from GitHub repository. Usage: owner/repo/path format, e.g. 'poogas/hermes-skill-installer/hermes-skill-installer'",
    inputSchema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "Skill identifier in format 'owner/repo/path' or just 'owner/repo' if SKILL.md is in repo root"
        },
        force: {
          type: "boolean",
          description: "Force reinstall if skill already exists",
          default: false
        }
      },
      required: ["identifier"]
    }
  }
];

class HermesSkillInstallerServer {
  constructor() {
    this.server = new Server(
      {
        name: "hermes-skill-installer",
        version: "1.0.0"
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
        if (name === "skill_install") {
          return await this.skillInstall(args);
        } else {
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

  runCommand(cmd, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, {
        cwd: os.homedir(),
        stdio: ['ignore', 'pipe', 'pipe']
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
        reject(new Error('Command timed out after 120 seconds'));
      }, 120000);
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

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Hermes Skill Installer MCP Server started");
  }
}

const server = new HermesSkillInstallerServer();
server.start().catch(console.error);
