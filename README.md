# agent-did OpenClaw Plugin

OpenClaw plugin for W3C-compliant DID and Verifiable Credential management for AI agents.

## Installation

```bash
openclaw plugins install dantber/openclaw-agent-did
```

## Usage

Set your passphrase as an environment variable:

```bash
export AGENT_DID_PASSPHRASE="your-secure-passphrase"
```

Or use `--no-encryption` flag (not recommended for production).

### Create Identities

```bash
# Create owner identity
openclaw agent-did create owner --name "Alice"

# Create agent identity
openclaw agent-did create agent --name "Assistant" --owner <owner-did>
```

### List and Inspect Identities

```bash
# List all identities
openclaw agent-did list

# Inspect specific identity
openclaw agent-did inspect --did <did>

# Delete identity
openclaw agent-did delete --did <did>
```

### Issue Verifiable Credentials

```bash
# Issue ownership credential
openclaw agent-did vc issue ownership \
  --issuer <owner-did> \
  --subject <agent-did> \
  --out ownership.jwt

# Issue capability credential
openclaw agent-did vc issue capability \
  --issuer <owner-did> \
  --subject <agent-did> \
  --scopes read,write,execute \
  --audience https://api.example.com \
  --expires 2026-12-31T23:59:59Z \
  --out capability.jwt
```

### Verify Credentials

```bash
# Verify credential
openclaw agent-did vc verify --file ownership.jwt

# Verify with expected issuer/subject
openclaw agent-did vc verify \
  --file ownership.jwt \
  --issuer <expected-issuer-did> \
  --subject <expected-subject-did>
```

### Manage Credentials

```bash
# List stored credentials
openclaw agent-did vc list

# Inspect credential without verifying
openclaw agent-did vc inspect --file ownership.jwt

# Delete stored credential
openclaw agent-did vc delete --id <credential-id> --yes
```

### Authentication

```bash
# Sign authentication challenge
openclaw agent-did auth sign \
  --did <agent-did> \
  --challenge <nonce> \
  --audience https://api.example.com \
  --domain example.com \
  --expires-in 300

# Verify authentication signature
openclaw agent-did auth verify \
  --did <agent-did> \
  --payload <base64url-payload> \
  --signature <base64url-signature> \
  --nonce <expected-nonce>
```

## Command Reference

### Create Commands

- `openclaw agent-did create owner --name <name>` - Create owner identity
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
- `openclaw agent-did create agent --name <name> --owner <did>` - Create agent identity
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`

### Identity Commands

- `openclaw agent-did list` - List all identities
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
- `openclaw agent-did inspect --did <did>` - Inspect specific identity
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
- `openclaw agent-did delete --did <did>` - Delete identity
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`

### VC Commands

- `openclaw agent-did vc issue ownership --issuer <did> --subject <did>` - Issue ownership credential
  - Options: `--out <file>`, `-s/--store <path>`, `--no-encryption`, `--json`
- `openclaw agent-did vc issue capability --issuer <did> --subject <did> --scopes <scopes>` - Issue capability credential
  - Options: `--audience <string>`, `--expires <date>`, `--out <file>`, `-s/--store <path>`, `--no-encryption`, `--json`
- `openclaw agent-did vc verify --file <file>` - Verify credential
  - Options: `--issuer <did>`, `--subject <did>`, `--json`
- `openclaw agent-did vc list` - List stored credentials in keystore
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
- `openclaw agent-did vc inspect --file <file>` - Decode credential without verifying
  - Options: `--json`
  - Returns: Decoded header and payload (no signature verification)
- `openclaw agent-did vc delete --id <id> --yes` - Delete stored credential
  - Required: `--yes` flag to confirm deletion
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`

### Auth Commands

- `openclaw agent-did auth sign --did <did> --challenge <nonce>` - Sign authentication challenge
  - Options: `--audience <string>`, `--domain <string>`, `--expires-in <seconds>`, `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: Signed payload and signature (base64url encoded)
- `openclaw agent-did auth verify --did <did> --payload <b64> --signature <b64>` - Verify authentication signature
  - Options: `--nonce <expected>`, `--audience <expected>`, `--domain <expected>`, `--json`
  - Returns: Verification result with payload details

## Environment Variables

- `AGENT_DID_HOME` - Custom keystore path (default: `~/.agent-did`)
- `AGENT_DID_PASSPHRASE` - Passphrase for keystore encryption

## Architecture

This plugin uses **library imports** from the agent-did package instead of subprocess calls:

- **Better Performance** - No process spawning overhead
- **Type Safety** - Full TypeScript type checking
- **Error Handling** - Structured exceptions vs parsing stderr
- **Shared State** - Singleton keystore manager prevents re-initialization

### Key Components

- **KeystoreManager** - Singleton pattern for keystore instances
- **Commands** - Commander.js command handlers that import agent-did functions
- **Utils** - Output formatting and error normalization

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run dev

# Build
npm run build

# After changes, reload plugin in OpenClaw
openclaw plugin reload agent-did
```

## Compatibility

The plugin shares keystores with the standalone agent-did CLI. You can use both interchangeably:

```bash
# Create with plugin
openclaw agent-did create owner --name "Alice"

# List with standalone CLI
agent-did list

# Both work with the same keystore
```

## License

MIT
