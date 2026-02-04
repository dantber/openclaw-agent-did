import { Command } from 'commander';
import { signAuthChallenge, verifyAuthChallenge } from 'agent-did';
import KeystoreManager from '../utils/keystore-manager.js';
import { outputJson } from '../utils/output-formatter.js';
import { normalizeError, formatError } from '../utils/error-handler.js';

/**
 * Sign authentication challenge command
 */
export function signCommand(): Command {
  return new Command('sign')
    .description('Sign an authentication challenge')
    .requiredOption('--did <did>', 'Agent DID to sign with')
    .requiredOption('--challenge <challenge>', 'Challenge string (nonce) to sign')
    .option('--audience <audience>', 'Audience (server identifier)')
    .option('--domain <domain>', 'Domain (server domain)')
    .option('--expires-in <seconds>', 'Expiration time in seconds (default: 120)', '120')
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

        // Validate identity exists
        const identity = await keystore.getIdentity(options.did);
        if (!identity) {
          throw new Error(`Identity not found: ${options.did}`);
        }

        // Get key pair
        const keyPair = await keystore.getKeyPair(options.did);
        if (!keyPair) {
          throw new Error(`Private key not found for: ${options.did}`);
        }

        // Sign the challenge
        const result = await signAuthChallenge(
          options.did,
          keyPair.privateKey,
          keyPair.publicKey,
          options.challenge,
          {
            audience: options.audience,
            domain: options.domain,
            expiresIn: parseInt(options.expiresIn, 10),
          }
        );

        if (options.json) {
          console.log(outputJson(result));
        } else {
          console.log('\n✓ Challenge signed successfully');
          console.log('\n=== Signature Result ===\n');
          console.log(`DID:         ${result.did}`);
          console.log(`Key ID:      ${result.kid}`);
          console.log(`Algorithm:   ${result.alg}`);
          console.log(`Created:     ${result.createdAt}`);
          console.log(`Expires:     ${result.expiresAt}`);
          console.log(`\n=== Payload (base64url) ===`);
          console.log(result.payloadEncoded);
          console.log(`\n=== Signature (base64url) ===`);
          console.log(result.signature);
          console.log(`\n=== Full Response (for server) ===\n`);
          console.log(outputJson(result));
        }
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(formatError(normalized));
        process.exit(1);
      }
    });
}

/**
 * Verify authentication signature command
 */
export function verifyCommand(): Command {
  return new Command('verify')
    .description('Verify an authentication signature')
    .requiredOption('--did <did>', 'DID that signed the challenge')
    .requiredOption('--payload <payload>', 'Base64url-encoded payload')
    .requiredOption('--signature <signature>', 'Base64url-encoded signature')
    .option('--nonce <nonce>', 'Expected nonce (challenge)')
    .option('--audience <audience>', 'Expected audience')
    .option('--domain <domain>', 'Expected domain')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const result = await verifyAuthChallenge(
          options.did,
          options.payload,
          options.signature,
          {
            expectedNonce: options.nonce,
            expectedAudience: options.audience,
            expectedDomain: options.domain,
          }
        );

        if (options.json) {
          console.log(outputJson(result));
          if (!result.valid) {
            process.exit(1);
          }
          return;
        }

        if (result.valid) {
          console.log('\n✓ Signature is valid');
          if (result.payload) {
            console.log(`\nDID:      ${result.payload.did}`);
            console.log(`Nonce:    ${result.payload.nonce}`);
            if (result.payload.aud) {
              console.log(`Audience: ${result.payload.aud}`);
            }
            if (result.payload.domain) {
              console.log(`Domain:   ${result.payload.domain}`);
            }
            console.log(`Issued:   ${new Date(result.payload.iat * 1000).toISOString()}`);
            console.log(`Expires:  ${new Date(result.payload.exp * 1000).toISOString()}`);
          }
        } else {
          console.error(`\n✗ Signature is invalid`);
          if (result.reason) {
            console.error(`Reason: ${result.reason}`);
          }
          process.exit(1);
        }
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(formatError(normalized));
        process.exit(1);
      }
    });
}
