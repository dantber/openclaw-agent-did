import { Command } from 'commander';
import { createOwnerCommand, createAgentCommand } from './commands/create.js';
import {
  listCommand as identityListCommand,
  inspectCommand as identityInspectCommand,
  deleteCommand as identityDeleteCommand,
} from './commands/identity.js';
import {
  issueOwnershipCommand,
  issueCapabilityCommand,
  verifyCommand as vcVerifyCommand,
  listCommand as vcListCommand,
  deleteCommand as vcDeleteCommand,
  inspectCommand as vcInspectCommand,
} from './commands/vc.js';
import { signCommand, verifyCommand as authVerifyCommand } from './commands/auth.js';

/**
 * OpenClaw API interface
 * This is provided by OpenClaw when the plugin is loaded
 */
interface OpenClawAPI {
  registerCli(command: string, program: Command): void;
}

/**
 * Plugin registration function
 * Called by OpenClaw when loading the plugin
 */
export function register(api: OpenClawAPI): void {
  const program = new Command('agent-did')
    .description('Manage AI agent identities with DIDs and Verifiable Credentials')
    .version('0.1.0');

  // Create command group
  const createCommand = new Command('create')
    .description('Create new identities');
  createCommand.addCommand(createOwnerCommand());
  createCommand.addCommand(createAgentCommand());
  program.addCommand(createCommand);

  // Identity management commands (top-level)
  program.addCommand(identityListCommand());
  program.addCommand(identityInspectCommand());
  program.addCommand(identityDeleteCommand());

  // VC command group
  const vcCommand = new Command('vc')
    .description('Verifiable Credential operations');

  // VC issue subcommand group
  const issueCommand = new Command('issue')
    .description('Issue credentials');
  issueCommand.addCommand(issueOwnershipCommand());
  issueCommand.addCommand(issueCapabilityCommand());
  vcCommand.addCommand(issueCommand);

  // VC management commands
  vcCommand.addCommand(vcVerifyCommand());
  vcCommand.addCommand(vcListCommand());
  vcCommand.addCommand(vcInspectCommand());
  vcCommand.addCommand(vcDeleteCommand());

  program.addCommand(vcCommand);

  // Auth command group
  const authCommand = new Command('auth')
    .description('Authentication operations (sign/verify challenges)');
  authCommand.addCommand(signCommand());
  authCommand.addCommand(authVerifyCommand());
  program.addCommand(authCommand);

  // Register with OpenClaw
  api.registerCli('agent-did', program);
}
