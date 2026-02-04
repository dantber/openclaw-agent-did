#!/usr/bin/env node

/**
 * Test script to verify plugin structure
 * This simulates OpenClaw loading the plugin
 */

const plugin = require('./dist/index.js');
const { Command } = require('commander');

// Mock OpenClaw API
const mockApi = {
  registerCli: (callback, options) => {
    console.log(`✓ Plugin registered commands: ${options.commands.join(', ')}`);

    // Create a mock program (simulating OpenClaw's Commander instance)
    const program = new Command();

    // Call the plugin's callback with the program
    callback({ program });

    // List all commands that were registered
    console.log(`✓ Program has ${program.commands.length} top-level commands:\n`);

    // List all commands recursively
    function listCommands(cmd, indent = '  ') {
      console.log(`${indent}${cmd.name()} - ${cmd.description()}`);
      if (cmd.commands && cmd.commands.length > 0) {
        cmd.commands.forEach(subcmd => listCommands(subcmd, indent + '  '));
      }
    }

    program.commands.forEach(cmd => listCommands(cmd));

    console.log('\n✓ Plugin structure looks good!');
  }
};

// Register plugin
try {
  plugin.register(mockApi);
  console.log('\n✓ Plugin loaded successfully');
  process.exit(0);
} catch (error) {
  console.error('✗ Plugin failed to load:', error);
  process.exit(1);
}
