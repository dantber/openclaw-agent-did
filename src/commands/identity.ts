import type { Command } from 'commander';
import KeystoreManager from '../utils/keystore-manager.js';
import { outputJson, formatDid, formatDate } from '../utils/output-formatter.js';
import { normalizeError, formatError } from '../utils/error-handler.js';

/**
 * List all identities command
 */
export function listCommand(parent: Command): void {
  parent.command('list')
    .description('List all identities in the keystore')
    .option('-s, --store <path>', 'Keystore path (default: ~/.agent-did)')
    .option('--no-encryption', 'Keystore is not encrypted')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const keystore = await KeystoreManager.getKeystore(
          options.store,
          options.encryption === false
        );
        await keystore.init();

        const identities = await keystore.listIdentities();

        if (options.json) {
          console.log(outputJson(identities));
        } else {
          if (identities.length === 0) {
            console.log('No identities found.');
            return;
          }

          console.log(`\nFound ${identities.length} identit${identities.length === 1 ? 'y' : 'ies'}:\n`);

          for (const identity of identities) {
            console.log(`${identity.type.toUpperCase().padEnd(7)} ${identity.name}`);
            console.log(`         DID: ${formatDid(identity.did)}`);
            console.log(`         Created: ${formatDate(identity.createdAt)}`);
            if (identity.ownerDid) {
              console.log(`         Owner: ${formatDid(identity.ownerDid)}`);
            }
            console.log();
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
 * Inspect a specific identity command
 */
export function inspectCommand(parent: Command): void {
  parent.command('inspect')
    .description('Inspect a specific identity')
    .requiredOption('--did <did>', 'DID to inspect')
    .option('-s, --store <path>', 'Keystore path (default: ~/.agent-did)')
    .option('--no-encryption', 'Keystore is not encrypted')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const keystore = await KeystoreManager.getKeystore(
          options.store,
          options.encryption === false
        );
        await keystore.init();

        const identity = await keystore.getIdentity(options.did);

        if (!identity) {
          throw new Error(`Identity not found: ${options.did}`);
        }

        const output = {
          did: identity.did,
          kid: `${identity.did}#${identity.did.split(':')[2]}`,
          name: identity.name,
          type: identity.type,
          createdAt: identity.createdAt,
          ...(identity.ownerDid && { ownerDid: identity.ownerDid }),
        };

        if (options.json) {
          console.log(outputJson(output));
        } else {
          console.log('\nIdentity Details:');
          console.log('─'.repeat(60));
          console.log(`Name       : ${output.name}`);
          console.log(`Type       : ${output.type}`);
          console.log(`DID        : ${output.did}`);
          console.log(`Key ID     : ${output.kid}`);
          console.log(`Created    : ${formatDate(output.createdAt)}`);
          if (output.ownerDid) {
            console.log(`Owner DID  : ${output.ownerDid}`);
          }
          console.log('─'.repeat(60) + '\n');
        }
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(formatError(normalized));
        process.exit(1);
      }
    });
}

/**
 * Delete an identity command
 */
export function deleteCommand(parent: Command): void {
  parent.command('delete')
    .description('Delete an identity from the keystore')
    .requiredOption('--did <did>', 'DID to delete')
    .option('-s, --store <path>', 'Keystore path (default: ~/.agent-did)')
    .option('--no-encryption', 'Keystore is not encrypted')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const keystore = await KeystoreManager.getKeystore(
          options.store,
          options.encryption === false
        );
        await keystore.init();

        // Verify identity exists
        const identity = await keystore.getIdentity(options.did);
        if (!identity) {
          throw new Error(`Identity not found: ${options.did}`);
        }

        // Delete the identity
        await keystore.deleteIdentity(options.did);

        if (options.json) {
          console.log(outputJson({ success: true, did: options.did }));
        } else {
          console.log(`✓ Identity deleted: ${identity.name} (${formatDid(options.did)})`);
        }
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(formatError(normalized));
        process.exit(1);
      }
    });
}
