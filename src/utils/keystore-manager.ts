import * as path from 'path';
import * as os from 'os';
import { Keystore } from 'agent-did';

/**
 * Singleton keystore manager to avoid reinitializing the keystore
 * across multiple commands in the same session.
 */
class KeystoreManager {
  private static instance: Keystore | null = null;
  private static currentPath: string | null = null;
  private static currentEncryption: boolean | null = null;

  /**
   * Get or create a keystore instance
   */
  static async getKeystore(
    customPath?: string,
    noEncryption = false
  ): Promise<Keystore> {
    const resolvedPath = this.getStorePath(customPath);

    // Return cached instance if path and encryption settings match
    if (
      this.instance &&
      this.currentPath === resolvedPath &&
      this.currentEncryption === !noEncryption
    ) {
      return this.instance;
    }

    // Create new instance
    const passphrase = await this.getPassphrase(noEncryption);

    if (noEncryption && passphrase === null) {
      console.log('\n⚠️  WARNING: Keys will be stored UNENCRYPTED on disk!');
      console.log('This is NOT recommended for production use.\n');
    }

    this.instance = new Keystore(resolvedPath, passphrase, true);
    this.currentPath = resolvedPath;
    this.currentEncryption = !noEncryption;

    return this.instance;
  }

  /**
   * Get a new keystore instance for creating data (validates passphrase)
   */
  static async getNewKeystore(
    customPath?: string,
    noEncryption = false
  ): Promise<Keystore> {
    const resolvedPath = this.getStorePath(customPath);
    const passphrase = await this.getPassphrase(noEncryption);

    if (noEncryption && passphrase === null) {
      console.log('\n⚠️  WARNING: Keys will be stored UNENCRYPTED on disk!');
      console.log('This is NOT recommended for production use.\n');
    }

    // Don't cache this - it validates passphrase strength
    return new Keystore(resolvedPath, passphrase, false);
  }

  /**
   * Clear cached keystore instance
   */
  static clearCache(): void {
    this.instance = null;
    this.currentPath = null;
    this.currentEncryption = null;
  }

  /**
   * Get the keystore path
   */
  private static getStorePath(customPath?: string): string {
    if (customPath) return path.resolve(customPath);
    return process.env.AGENT_DID_HOME || path.join(os.homedir(), '.agent-did');
  }

  /**
   * Get the passphrase with fallback chain:
   * 1. If noEncryption is true, return null
   * 2. Try environment variable
   * 3. Otherwise error (OpenClaw doesn't support interactive prompts)
   */
  private static async getPassphrase(noEncryption = false): Promise<string | null> {
    // Option 1: No encryption requested
    if (noEncryption) {
      return null;
    }

    // Option 2: Environment variable
    const envPassphrase = process.env.AGENT_DID_PASSPHRASE;
    if (envPassphrase !== undefined) {
      // Empty string means no encryption
      if (envPassphrase === '') {
        return null;
      }
      return envPassphrase;
    }

    // Option 3: No passphrase available
    throw new Error(
      'Passphrase required but not available. ' +
        'Set AGENT_DID_PASSPHRASE environment variable or use --no-encryption flag.'
    );
  }
}

export default KeystoreManager;
