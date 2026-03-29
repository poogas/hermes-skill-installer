#!/usr/bin/env python3
"""
Hermes Skill Installer MCP Server

This MCP server allows Hermes Agent to install skills from GitHub
by running `hermes skills install` on the host machine.

Configuration in ~/.hermes/config.yaml:
    mcp_servers:
      skill-installer:
        command: python
        args: ["/path/to/skill_installer_mcp.py"]

Requires: pip install mcp
"""

import json
import subprocess
import sys
import os
from pathlib import Path

# MCP server implementation using the official SDK
try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent
    from mcp.server.stdio import stdio_server
    import asyncio
except ImportError:
    print("Error: 'mcp' package not installed. Run: pip install mcp", file=sys.stderr)
    sys.exit(1)


# Initialize the server with a unique name
server = Server("hermes-skill-installer")


@server.list_tools()
async def list_tools():
    """Declare available tools to Hermes."""
    return [
        Tool(
            name="skill_install",
            description="Install a Hermes skill from GitHub repository. Usage: owner/repo/path format, e.g. 'poogas/hermes-skill-installer/hermes-skill-installer'",
            inputSchema={
                "type": "object",
                "properties": {
                    "identifier": {
                        "type": "string",
                        "description": "Skill identifier in format 'owner/repo/path' or just 'owner/repo' if SKILL.md is in repo root"
                    },
                    "force": {
                        "type": "boolean",
                        "description": "Force reinstall if skill already exists",
                        "default": False
                    }
                },
                "required": ["identifier"]
            }
        ),
        Tool(
            name="skill_list",
            description="List all installed Hermes skills",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="skill_search",
            description="Search for skills in Hermes Skills Hub",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query to find skills"
                    }
                },
                "required": ["query"]
            }
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls from Hermes."""
    
    if name == "skill_install":
        identifier = arguments.get("identifier", "")
        force = arguments.get("force", False)
        
        if not identifier:
            return [TextContent(type="text", text="Error: identifier is required")]
        
        # Build the hermes command
        cmd = ["hermes", "skills", "install", identifier]
        if force:
            cmd.append("--force")
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120,
                cwd=os.path.expanduser("~")
            )
            
            if result.returncode == 0:
                output = result.stdout if result.stdout else "Skill installed successfully!"
                return [TextContent(type="text", text=output)]
            else:
                error = result.stderr if result.stderr else result.stdout
                return [TextContent(type="text", text=f"Error installing skill:\n{error}")]
                
        except subprocess.TimeoutExpired:
            return [TextContent(type="text", text="Error: Command timed out after 120 seconds")]
        except FileNotFoundError:
            return [TextContent(type="text", text="Error: 'hermes' command not found. Is Hermes installed?")]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    elif name == "skill_list":
        try:
            result = subprocess.run(
                ["hermes", "skills", "list"],
                capture_output=True,
                text=True,
                timeout=30,
                cwd=os.path.expanduser("~")
            )
            output = result.stdout if result.stdout else result.stderr
            return [TextContent(type="text", text=output or "No skills found")]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    elif name == "skill_search":
        query = arguments.get("query", "")
        if not query:
            return [TextContent(type="text", text="Error: query is required")]
        
        try:
            result = subprocess.run(
                ["hermes", "skills", "search", query],
                capture_output=True,
                text=True,
                timeout=30,
                cwd=os.path.expanduser("~")
            )
            output = result.stdout if result.stdout else result.stderr
            return [TextContent(type="text", text=output or "No results found")]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
