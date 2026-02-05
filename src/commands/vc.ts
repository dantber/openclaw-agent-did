import type { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  createOwnershipCredential,
  createCapabilityCredential,
  signCredential,
  verifyCredential,
  decodeCredential,
  type JWTPayload,
} from 'agent-did';
import KeystoreManager from '../utils/keystore-manager.js';
import { outputJson, formatDate } from '../utils/output-formatter.js';
import { normalizeError, formatError } from '../utils/error-handler.js';

/**
 * Issue ownership credential command
 */
export function issueOwnershipCommand(parent: Command): void {
  parent.command('ownership')
    .description('Issue an ownership credential')
    .requiredOption('--issuer <did>', 'Issuer DID (owner)')
    .requiredOption('--subject <did>', 'Subject DID (agent)')
    .option('--out <file>', 'Output file (default: stdout)')
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

        // Get issuer identity
        const issuerIdentity = await keystore.getIdentity(options.issuer);
        if (!issuerIdentity) {
          throw new Error(`Issuer identity not found: ${options.issuer}`);
        }
        if (issuerIdentity.type !== 'owner') {
          throw new Error(`Issuer must be an owner: ${options.issuer}`);
        }

        // Get subject identity (optional - might not be in keystore)
        const subjectIdentity = await keystore.getIdentity(options.subject);

        // Create credential
        const credential = createOwnershipCredential(
          options.issuer,
          options.subject,
          {
            name: subjectIdentity?.name,
            createdAt: subjectIdentity?.createdAt,
          }
        );

        // Get issuer's key pair
        const keyPair = await keystore.getKeyPair(options.issuer);
        if (!keyPair) {
          throw new Error(`Private key not found for: ${options.issuer}`);
        }

        // Sign credential
        const jwt = await signCredential(credential, keyPair.privateKey, keyPair.publicKey);

        // Output
        if (options.out) {
          const outputPath = path.resolve(options.out);
          fs.writeFileSync(outputPath, jwt, 'utf8');
          if (!options.json) {
            console.log(`✓ Ownership credential issued and saved to: ${outputPath}`);
          } else {
            console.log(outputJson({ success: true, file: outputPath }));
          }
        } else {
          if (options.json) {
            console.log(outputJson({ jwt }));
          } else {
            console.log(jwt);
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
 * Issue capability credential command
 */
export function issueCapabilityCommand(parent: Command): void {
  parent.command('capability')
    .description('Issue a capability credential')
    .requiredOption('--issuer <did>', 'Issuer DID (owner)')
    .requiredOption('--subject <did>', 'Subject DID (agent)')
    .requiredOption('--scopes <scopes>', 'Comma-separated scopes (e.g., read,write,execute)')
    .option('--audience <string>', 'Intended audience')
    .option('--expires <date>', 'Expiration date (ISO 8601)')
    .option('--out <file>', 'Output file (default: stdout)')
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

        // Get issuer identity
        const issuerIdentity = await keystore.getIdentity(options.issuer);
        if (!issuerIdentity) {
          throw new Error(`Issuer identity not found: ${options.issuer}`);
        }
        if (issuerIdentity.type !== 'owner') {
          throw new Error(`Issuer must be an owner: ${options.issuer}`);
        }

        // Parse scopes
        const scopes = options.scopes.split(',').map((s: string) => s.trim());

        // Create credential
        const credential = createCapabilityCredential(
          options.issuer,
          options.subject,
          scopes,
          {
            audience: options.audience,
            expires: options.expires,
          }
        );

        // Get issuer's key pair
        const keyPair = await keystore.getKeyPair(options.issuer);
        if (!keyPair) {
          throw new Error(`Private key not found for: ${options.issuer}`);
        }

        // Sign credential
        const jwt = await signCredential(credential, keyPair.privateKey, keyPair.publicKey);

        // Output
        if (options.out) {
          const outputPath = path.resolve(options.out);
          fs.writeFileSync(outputPath, jwt, 'utf8');
          if (!options.json) {
            console.log(`✓ Capability credential issued and saved to: ${outputPath}`);
          } else {
            console.log(outputJson({ success: true, file: outputPath }));
          }
        } else {
          if (options.json) {
            console.log(outputJson({ jwt }));
          } else {
            console.log(jwt);
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
 * Verify credential command
 */
export function verifyCommand(parent: Command): void {
  parent.command('verify')
    .description('Verify a credential')
    .requiredOption('--file <file>', 'Path to JWT file')
    .option('--issuer <did>', 'Expected issuer DID')
    .option('--subject <did>', 'Expected subject DID')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        // Read JWT from file
        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        const jwt = fs.readFileSync(filePath, 'utf8').trim();

        // Verify credential
        const result = await verifyCredential(jwt, {
          allowedIssuers: options.issuer ? [options.issuer] : undefined,
          expectedSubject: options.subject,
        });

        if (options.json) {
          console.log(outputJson(result));
        } else {
          if (result.valid) {
            console.log('✓ Credential is valid\n');

            if (result.payload) {
              const { iss, sub, iat, exp, vc } = result.payload;
              console.log('JWT Claims:');
              console.log(`  Issuer    : ${iss}`);
              console.log(`  Subject   : ${sub}`);
              console.log(`  Issued At : ${new Date(iat * 1000).toISOString()}`);
              if (exp) {
                console.log(`  Expires   : ${new Date(exp * 1000).toISOString()}`);
              }

              console.log('\nCredential:');
              console.log(`  Type      : ${vc.type.join(', ')}`);
              console.log(`  Valid From: ${vc.validFrom}`);
              if (vc.validUntil) {
                console.log(`  Valid Until: ${vc.validUntil}`);
              }

              console.log('\nCredential Subject:');
              for (const [key, value] of Object.entries(vc.credentialSubject)) {
                if (key !== 'id') {
                  console.log(`  ${key.padEnd(10)}: ${JSON.stringify(value)}`);
                }
              }
            }
          } else {
            console.error(`✗ Credential is invalid: ${result.reason || 'Unknown reason'}`);
            process.exit(1);
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
 * List stored credentials command
 */
export function listCommand(parent: Command): void {
  parent.command('list')
    .description('List stored credentials in the keystore')
    .option('-s, --store <path>', 'Keystore path (default: ~/.agent-did)')
    .option('--no-encryption', 'Keystore is not encrypted')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const keystore = await KeystoreManager.getKeystore(
          options.store,
          options.encryption === false
        );

        const exists = await keystore.exists();
        if (!exists) {
          if (options.json) {
            console.log(outputJson([]));
          } else {
            console.log('No credentials found. Keystore does not exist.');
          }
          return;
        }

        const stored = await keystore.listCredentials();
        if (stored.length === 0) {
          if (options.json) {
            console.log(outputJson([]));
          } else {
            console.log('No credentials found.');
          }
          return;
        }

        if (options.json) {
          console.log(outputJson(stored));
          return;
        }

        console.log(`\nFound ${stored.length} credential${stored.length === 1 ? '' : 's'}:\n`);

        stored.forEach((item) => {
          const jwt = extractJwt(item.data);
          const summary = jwt ? summarizeCredential(jwt) : {};

          console.log(`ID: ${item.id}`);
          if (summary.issuer) console.log(`  Issuer:  ${summary.issuer}`);
          if (summary.subject) console.log(`  Subject: ${summary.subject}`);
          if (summary.type) console.log(`  Type:    ${summary.type}`);
          if (summary.issuedAt) console.log(`  Issued:  ${formatDate(summary.issuedAt)}`);
          if (summary.expiresAt) console.log(`  Expires: ${formatDate(summary.expiresAt)}`);
          console.log('');
        });
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(formatError(normalized));
        process.exit(1);
      }
    });
}

/**
 * Delete stored credential command
 */
export function deleteCommand(parent: Command): void {
  parent.command('delete')
    .description('Delete a stored credential by ID')
    .requiredOption('--id <id>', 'Credential ID to delete')
    .option('-s, --store <path>', 'Keystore path (default: ~/.agent-did)')
    .option('--no-encryption', 'Keystore is not encrypted')
    .option('--yes', 'Confirm deletion without prompt')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        if (!options.yes) {
          throw new Error('Deletion requires --yes flag to confirm');
        }

        const keystore = await KeystoreManager.getKeystore(
          options.store,
          options.encryption === false
        );

        const deleted = await keystore.deleteCredential(options.id);

        if (options.json) {
          console.log(outputJson({ deleted, id: options.id }));
        } else {
          if (deleted) {
            console.log(`✓ Credential deleted: ${options.id}`);
          } else {
            console.error(`✗ Credential not found: ${options.id}`);
            process.exit(1);
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
 * Inspect credential command (decode without verifying)
 */
export function inspectCommand(parent: Command): void {
  parent.command('inspect')
    .description('Decode a verifiable credential without verifying signature')
    .requiredOption('--file <path>', 'Path to credential file (JWT)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        // Read file
        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Extract JWT (handle both raw JWT and JSON with jwt/credential field)
        let jwt: string;
        try {
          const parsed = JSON.parse(fileContent);
          jwt = parsed.credential || parsed.jwt || fileContent.trim();
        } catch {
          jwt = fileContent.trim();
        }

        // Decode without verifying
        const decoded = decodeCredential(jwt);
        if (!decoded) {
          throw new Error('Invalid JWT format');
        }

        if (options.json) {
          console.log(outputJson(decoded));
        } else {
          console.log('\n=== Header ===\n');
          console.log(outputJson(decoded.header || {}));
          console.log('\n=== Payload ===\n');
          console.log(outputJson(decoded.payload || {}));
        }
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(formatError(normalized));
        process.exit(1);
      }
    });
}

/**
 * Helper: Extract JWT from stored credential data
 */
function extractJwt(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const maybe = data as { credential?: string; jwt?: string };
    return maybe.credential || maybe.jwt || null;
  }
  return null;
}

/**
 * Helper: Summarize credential from JWT
 */
function summarizeCredential(jwt: string): {
  issuer?: string;
  subject?: string;
  type?: string;
  issuedAt?: string;
  expiresAt?: string;
} {
  const decoded = decodeCredential(jwt);
  if (!decoded?.payload) return {};

  const payload = decoded.payload as JWTPayload;
  const type = Array.isArray(payload.vc?.type) ? payload.vc.type.join(', ') : undefined;
  const issuedAt = payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined;
  const expiresAt = payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined;

  return {
    issuer: payload.iss,
    subject: payload.sub,
    type,
    issuedAt,
    expiresAt,
  };
}
