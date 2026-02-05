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
    callback: (context: { program: unknown }) => void,
    options: { commands: string[] }
  ): void;
}

/**
 * Plugin registration function
 * Called by OpenClaw when loading the plugin
 */
export function register(api: OpenClawAPI): void {
  api.registerCli(
    ({ program }: { program: any }) => {
      // Create main agent-did command using program.command() (not new Command())
      const agentDidCmd = program.command('agent-did')
        .description('Manage AI agent identities with DIDs and Verifiable Credentials');

      // Create command group
      const createCmd = agentDidCmd.command('create')
        .description('Create new identities');

      // Register subcommands on their parent via parent.command()
      createOwnerCommand(createCmd);
      createAgentCommand(createCmd);

      // Identity commands
      identityListCommand(agentDidCmd);
      identityInspectCommand(agentDidCmd);
      identityDeleteCommand(agentDidCmd);

      // VC command group
      const vcCmd = agentDidCmd.command('vc')
        .description('Verifiable Credential operations');

      // VC issue subcommand group
      const issueCmd = vcCmd.command('issue')
        .description('Issue credentials');

      issueOwnershipCommand(issueCmd);
      issueCapabilityCommand(issueCmd);

      // VC management commands
      vcVerifyCommand(vcCmd);
      vcListCommand(vcCmd);
      vcInspectCommand(vcCmd);
      vcDeleteCommand(vcCmd);

      // Auth command group
      const authCmd = agentDidCmd.command('auth')
        .description('Authentication operations (sign/verify challenges)');

      signCommand(authCmd);
      authVerifyCommand(authCmd);
    },
    { commands: ['agent-did'] }
  );
}
