import type { Command } from 'commander';
import { generateKeyPair, publicKeyToDidKey } from 'agent-did';
import KeystoreManager from '../utils/keystore-manager.js';
import { formatOutput } from '../utils/output-formatter.js';
import { normalizeError, formatError } from '../utils/error-handler.js';

/**
 * Create owner identity command
 */
export function createOwnerCommand(parent: Command): void {
  parent.command('owner')
    .description('Create a new owner identity')
    .requiredOption('-n, --name <name>', 'Name for the owner identity')
    .option('-s, --store <path>', 'Keystore path (default: ~/.agent-did)')
    .option('--no-encryption', 'Store keys unencrypted (NOT RECOMMENDED)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        // Get keystore instance
        const keystore = await KeystoreManager.getNewKeystore(
          options.store,
          options.encryption === false
        );
        await keystore.init();

        // Generate key pair
        const keyPair = await generateKeyPair();
        const did = publicKeyToDidKey(keyPair.publicKey);

        // Create metadata
        const metadata = {
          did,
          type: 'owner' as const,
          name: options.name,
          createdAt: new Date().toISOString(),
        };

        // Store identity
        await keystore.storeIdentity(metadata, keyPair);

        const output = {
          did,
          kid: `${did}#${did.split(':')[2]}`,
          name: options.name,
          type: 'owner',
          createdAt: metadata.createdAt,
        };

        console.log(formatOutput(output, options.json));

        if (!options.json) {
          console.log('\n✓ Owner identity created successfully');
          if (options.encryption !== false) {
            console.log('IMPORTANT: Store your passphrase securely. It cannot be recovered.');
          }
        }
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(formatError(normalized));
        process.exit(1);
      }
    });
}

/**
 * Create agent identity command
 */
export function createAgentCommand(parent: Command): void {
  parent.command('agent')
    .description('Create a new agent identity')
    .requiredOption('-n, --name <name>', 'Name for the agent identity')
    .requiredOption('--owner <did>', 'DID of the owner')
    .option('-s, --store <path>', 'Keystore path (default: ~/.agent-did)')
    .option('--no-encryption', 'Store keys unencrypted (NOT RECOMMENDED)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        // Get keystore instance
        const keystore = await KeystoreManager.getNewKeystore(
          options.store,
          options.encryption === false
        );
        await keystore.init();

        // Verify owner exists
        const ownerIdentity = await keystore.getIdentity(options.owner);
        if (!ownerIdentity) {
          throw new Error(`Owner identity not found: ${options.owner}`);
        }
        if (ownerIdentity.type !== 'owner') {
          throw new Error(`Specified DID is not an owner: ${options.owner}`);
        }

        // Generate key pair
        const keyPair = await generateKeyPair();
        const did = publicKeyToDidKey(keyPair.publicKey);

        // Create metadata with owner reference
        const metadata = {
          did,
          type: 'agent' as const,
          name: options.name,
          createdAt: new Date().toISOString(),
          ownerDid: options.owner,
        };

        // Store identity
        await keystore.storeIdentity(metadata, keyPair);

        const output = {
          did,
          kid: `${did}#${did.split(':')[2]}`,
          name: options.name,
          type: 'agent',
          ownerDid: options.owner,
          createdAt: metadata.createdAt,
        };

        console.log(formatOutput(output, options.json));

        if (!options.json) {
          console.log('\n✓ Agent identity created successfully');
          if (options.encryption !== false) {
            console.log('IMPORTANT: Store your passphrase securely. It cannot be recovered.');
          }
        }
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(formatError(normalized));
        process.exit(1);
      }
    });
}
