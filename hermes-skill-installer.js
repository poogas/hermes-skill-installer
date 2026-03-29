#!/usr/bin/env node
/**
 * Hermes Skill Installer MCP Server
 * Wrapper to run Python MCP server via npx
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find the Python MCP server in the same directory
const scriptDir = __dirname;
const pyScript = path.join(scriptDir, 'skill_installer_mcp.py');

if (!fs.existsSync(pyScript)) {
  console.error(`Error: ${pyScript} not found`);
  process.exit(1);
}

// Spawn Python with the MCP server
const python = spawn('python3', [pyScript], {
  stdio: 'inherit',
  cwd: scriptDir
});

python.on('error', (err) => {
  console.error(`Failed to start Python: ${err.message}`);
  process.exit(1);
});

python.on('exit', (code) => {
  process.exit(code);
});
