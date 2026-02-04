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
  registerCli(
    callback: (context: { program: Command }) => void,
    options: { commands: string[] }
  ): void;
}

/**
 * Plugin registration function
 * Called by OpenClaw when loading the plugin
 */
export function register(api: OpenClawAPI): void {
  api.registerCli(
    ({ program }) => {
      // Create main agent-did command using program.command() (not new Command())
      const agentDidCmd = program.command('agent-did')
        .description('Manage AI agent identities with DIDs and Verifiable Credentials');

      // Create command group - use agentDidCmd.command() not new Command()
      const createCmd = agentDidCmd.command('create')
        .description('Create new identities');

      // Add subcommands - these are Command instances but we add them to a parent created with .command()
      createCmd.addCommand(createOwnerCommand());
      createCmd.addCommand(createAgentCommand());

      // Identity commands
      agentDidCmd.addCommand(identityListCommand());
      agentDidCmd.addCommand(identityInspectCommand());
      agentDidCmd.addCommand(identityDeleteCommand());

      // VC command group
      const vcCmd = agentDidCmd.command('vc')
        .description('Verifiable Credential operations');

      // VC issue subcommand group
      const issueCmd = vcCmd.command('issue')
        .description('Issue credentials');

      issueCmd.addCommand(issueOwnershipCommand());
      issueCmd.addCommand(issueCapabilityCommand());

      // VC management commands
      vcCmd.addCommand(vcVerifyCommand());
      vcCmd.addCommand(vcListCommand());
      vcCmd.addCommand(vcInspectCommand());
      vcCmd.addCommand(vcDeleteCommand());

      // Auth command group
      const authCmd = agentDidCmd.command('auth')
        .description('Authentication operations (sign/verify challenges)');

      authCmd.addCommand(signCommand());
      authCmd.addCommand(authVerifyCommand());
    },
    { commands: ['agent-did'] }
  );
}
