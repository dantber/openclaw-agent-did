---
name: agent-did OpenClaw Plugin
description: W3C-compliant DID and Verifiable Credential management for AI agents via OpenClaw. Use when working with decentralized identities, verifiable credentials, agent ownership proofs, capability delegation, cryptographic authentication, or registering agents with DID-enabled services like agent-did.xyz. Supports creating owner/agent identities, issuing credentials, verifying signatures, and autonomous service registration.
---

# agent-did OpenClaw Plugin

Manage W3C-compliant Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs) for AI agents through OpenClaw.

## Prerequisites

Set passphrase as environment variable:
```bash
export AGENT_DID_PASSPHRASE="secure-passphrase"
```

Or use `--no-encryption` flag (not recommended for production).

## Core Workflows

### Identity Management

**Create owner identity (human/organization):**
```bash
openclaw agent-did create owner --name "Alice"
```

**Create agent identity (AI agent):**
```bash
openclaw agent-did create agent --name "Assistant" --owner <owner-did>
```

**List all identities:**
```bash
openclaw agent-did list
openclaw agent-did list --json  # JSON output
```

**Inspect identity:**
```bash
openclaw agent-did inspect --did <did>
```

**Delete identity:**
```bash
openclaw agent-did delete --did <did>
```

### Credential Issuance

**Issue ownership credential (proves agent belongs to owner):**
```bash
openclaw agent-did vc issue ownership \
  --issuer <owner-did> \
  --subject <agent-did> \
  --out ownership.jwt
```

**Issue capability credential (delegates permissions to agent):**
```bash
openclaw agent-did vc issue capability \
  --issuer <owner-did> \
  --subject <agent-did> \
  --scopes read,write,execute \
  --audience https://api.example.com \
  --expires 2026-12-31T23:59:59Z \
  --out capability.jwt
```

### Credential Verification

**Verify credential:**
```bash
openclaw agent-did vc verify --file ownership.jwt
```

**Verify with expected issuer/subject:**
```bash
openclaw agent-did vc verify \
  --file ownership.jwt \
  --issuer <expected-issuer> \
  --subject <expected-subject>
```

### Credential Management

**List stored credentials:**
```bash
openclaw agent-did vc list
```

**Inspect credential (decode without verifying):**
```bash
openclaw agent-did vc inspect --file ownership.jwt
```

**Delete stored credential:**
```bash
openclaw agent-did vc delete --id <credential-id> --yes
```

## Common Patterns

### Pattern 1: Complete Agent Setup

Create complete agent identity with ownership proof:

```bash
# 1. Create owner
openclaw agent-did create owner --name "Company X"
# Save owner DID from output

# 2. Create agent
openclaw agent-did create agent --name "Sales Bot" --owner <owner-did>
# Save agent DID from output

# 3. Issue ownership credential
openclaw agent-did vc issue ownership \
  --issuer <owner-did> \
  --subject <agent-did> \
  --out credentials/ownership.jwt

# 4. Verify credential
openclaw agent-did vc verify --file credentials/ownership.jwt
```

### Pattern 2: Capability Delegation

Grant specific permissions to agent:

```bash
# Issue capability for API access
openclaw agent-did vc issue capability \
  --issuer <owner-did> \
  --subject <agent-did> \
  --scopes api:read,api:write \
  --audience https://api.example.com \
  --expires 2026-12-31T23:59:59Z \
  --out credentials/api-access.jwt

# Issue capability for database access
openclaw agent-did vc issue capability \
  --issuer <owner-did> \
  --subject <agent-did> \
  --scopes db:read,db:query \
  --audience postgres://db.example.com \
  --out credentials/db-access.jwt
```

### Pattern 3: Multi-Agent System

Create multiple agents for different purposes:

```bash
# Create owner once
openclaw agent-did create owner --name "Organization"

# Create specialized agents
openclaw agent-did create agent --name "Customer Support" --owner <owner-did>
openclaw agent-did create agent --name "Data Analyst" --owner <owner-did>
openclaw agent-did create agent --name "Content Writer" --owner <owner-did>

# List all identities
openclaw agent-did list
```

### Pattern 4: Challenge-Response Authentication

Sign and verify authentication challenges for secure communication:

```bash
# 1. Server generates random nonce
NONCE=$(openssl rand -hex 32)

# 2. Agent signs the challenge
openclaw agent-did auth sign \
  --did <agent-did> \
  --challenge $NONCE \
  --audience https://api.example.com \
  --domain example.com \
  --expires-in 300 \
  --json > auth-response.json

# Extract payload and signature from response
PAYLOAD=$(jq -r '.payloadEncoded' auth-response.json)
SIGNATURE=$(jq -r '.signature' auth-response.json)

# 3. Server verifies the signature
openclaw agent-did auth verify \
  --did <agent-did> \
  --payload $PAYLOAD \
  --signature $SIGNATURE \
  --nonce $NONCE \
  --audience https://api.example.com \
  --domain example.com

# If verification succeeds, agent is authenticated
```

### Pattern 5: Agent Registration on agent-did.xyz

Complete workflow for autonomous agents to register with the agent-did.xyz service:

```bash
# Step 1: Owner creates agent identity (one-time setup)
export AGENT_DID_PASSPHRASE="secure-passphrase"

# Create owner
openclaw agent-did create owner --name "My Organization" --json > owner.json
OWNER_DID=$(jq -r '.did' owner.json)

# Create agent
openclaw agent-did create agent \
  --name "Assistant Agent" \
  --owner $OWNER_DID \
  --json > agent.json
AGENT_DID=$(jq -r '.did' agent.json)

echo "Agent DID: $AGENT_DID"

# Step 2: Agent requests registration challenge from agent-did.xyz
CHALLENGE=$(curl -s https://agent-did.xyz/api/register/init \
  -H "Content-Type: application/json" \
  -d "{\"did\": \"$AGENT_DID\"}" | jq -r '.challenge')

echo "Challenge received: $CHALLENGE"

# Step 3: Agent signs the challenge
openclaw agent-did auth sign \
  --did $AGENT_DID \
  --challenge $CHALLENGE \
  --audience https://agent-did.xyz \
  --domain agent-did.xyz \
  --expires-in 300 \
  --json > auth-response.json

echo "Challenge signed"

# Step 4: Submit signed response to complete registration
curl -s https://agent-did.xyz/api/register/complete \
  -H "Content-Type: application/json" \
  -d @auth-response.json | jq

# Success! Agent is now registered with agent-did.xyz
# The service has verified:
# - Agent controls the private key for the DID
# - Signature is cryptographically valid
# - Challenge hasn't been reused (nonce verification)
```

**Key Benefits:**
- **No API Keys** - DID serves as the identity
- **Cryptographic Proof** - Challenge-response proves key ownership
- **Decentralized** - No central authority needed
- **Portable** - Same DID works across multiple services
- **Revocable** - Owner can revoke agent access anytime

## Command Reference

### Create Commands

- `create owner --name <name>` - Create owner identity
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: DID, kid, name, type, createdAt

- `create agent --name <name> --owner <did>` - Create agent identity
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: DID, kid, name, type, ownerDid, createdAt

### Identity Commands

- `list` - List all identities
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: Array of identity metadata

- `inspect --did <did>` - Inspect specific identity
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: Full identity details

- `delete --did <did>` - Delete identity
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: Success confirmation

### VC Commands

- `vc issue ownership --issuer <did> --subject <did>` - Issue ownership credential
  - Options: `--out <file>`, `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: JWT credential (to file or stdout)

- `vc issue capability --issuer <did> --subject <did> --scopes <scopes>` - Issue capability credential
  - Required: `--scopes` (comma-separated, e.g., `read,write,execute`)
  - Optional: `--audience <string>`, `--expires <ISO8601>`
  - Options: `--out <file>`, `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: JWT credential (to file or stdout)

- `vc verify --file <file>` - Verify credential
  - Optional: `--issuer <did>`, `--subject <did>` (for validation)
  - Options: `--json`
  - Returns: Verification result with payload details

- `vc list` - List stored credentials in keystore
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: Array of stored credentials with summary info

- `vc inspect --file <file>` - Decode credential without verifying
  - Required: `--file` (path to JWT file)
  - Options: `--json`
  - Returns: Decoded header and payload (no signature verification)

- `vc delete --id <id> --yes` - Delete stored credential
  - Required: `--id`, `--yes` (confirmation flag)
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: Success confirmation or error

### Auth Commands

- `auth sign --did <did> --challenge <nonce>` - Sign authentication challenge
  - Required: `--did`, `--challenge` (nonce/challenge string)
  - Optional: `--audience <string>`, `--domain <string>`, `--expires-in <seconds>` (default: 120)
  - Options: `-s/--store <path>`, `--no-encryption`, `--json`
  - Returns: Signed payload and signature (both base64url encoded)

- `auth verify --did <did> --payload <b64> --signature <b64>` - Verify authentication signature
  - Required: `--did`, `--payload`, `--signature` (both base64url encoded)
  - Optional: `--nonce <expected>`, `--audience <expected>`, `--domain <expected>`
  - Options: `--json`
  - Returns: Verification result with payload details (valid/invalid with reason)

## Options

### Common Options

- `--json` - Output as JSON (all commands)
- `-s/--store <path>` - Custom keystore path (default: `~/.agent-did`)
- `--no-encryption` - Use unencrypted keystore (NOT RECOMMENDED)

### Environment Variables

- `AGENT_DID_HOME` - Custom keystore directory (default: `~/.agent-did`)
- `AGENT_DID_PASSPHRASE` - Keystore encryption passphrase

## Understanding DIDs and VCs

### Decentralized Identifiers (DIDs)

DIDs are W3C standard identifiers that don't require central authority:

- Format: `did:key:z6Mk...` (Ed25519 public key encoded)
- Self-sovereign: Owner controls the identity
- Cryptographically verifiable: Linked to key pair
- Persistent: Same DID always maps to same keys

### Verifiable Credentials (VCs)

VCs are tamper-evident credentials with cryptographic proofs:

- **Ownership Credentials**: Prove agent belongs to owner
- **Capability Credentials**: Delegate specific permissions
- Format: JWT (JSON Web Token) with EdDSA signature
- Structure: Header + Payload (VC) + Signature

### Key Concepts

- **Owner**: Human or organization that controls agents (type: `owner`)
- **Agent**: AI agent owned by an owner (type: `agent`)
- **Issuer**: DID that signs the credential (usually owner)
- **Subject**: DID the credential is about (usually agent)
- **Scopes**: Permissions granted (for capability credentials)
- **Audience**: Intended recipient/service for the credential

## Use Cases

### 1. Agent Authentication

Prove agent identity when accessing services:
```bash
# Create agent and issue credential
openclaw agent-did create agent --name "API Agent" --owner <owner-did>
openclaw agent-did vc issue ownership --issuer <owner> --subject <agent> --out proof.jwt

# Service verifies credential
openclaw agent-did vc verify --file proof.jwt
```

### 2. Permission Delegation

Grant fine-grained permissions to agents:
```bash
# Different scopes for different agents
openclaw agent-did vc issue capability \
  --issuer <owner> --subject <read-only-agent> \
  --scopes read --out readonly.jwt

openclaw agent-did vc issue capability \
  --issuer <owner> --subject <admin-agent> \
  --scopes read,write,delete --out admin.jwt
```

### 3. Temporary Access

Issue time-limited credentials:
```bash
openclaw agent-did vc issue capability \
  --issuer <owner> --subject <agent> \
  --scopes access \
  --expires 2026-03-01T00:00:00Z \
  --out temp-access.jwt
```

### 4. Service-Specific Access

Restrict credentials to specific services:
```bash
openclaw agent-did vc issue capability \
  --issuer <owner> --subject <agent> \
  --scopes api:read,api:write \
  --audience https://api.example.com \
  --out service-access.jwt
```

### 5. Challenge-Response Authentication

Prove identity through cryptographic challenge:
```bash
# Server: Generate challenge
NONCE=$(openssl rand -hex 32)

# Agent: Sign challenge
openclaw agent-did auth sign \
  --did <agent-did> \
  --challenge $NONCE \
  --audience https://api.example.com \
  --expires-in 300 \
  --json > response.json

# Extract signature components
PAYLOAD=$(jq -r '.payloadEncoded' response.json)
SIGNATURE=$(jq -r '.signature' response.json)

# Server: Verify signature
openclaw agent-did auth verify \
  --did <agent-did> \
  --payload $PAYLOAD \
  --signature $SIGNATURE \
  --nonce $NONCE
```

## Error Handling

### Common Errors

**Missing passphrase:**
```
Error: Passphrase required but not available.
```
Solution: `export AGENT_DID_PASSPHRASE="..."` or use `--no-encryption`

**Invalid passphrase:**
```
Error: Invalid passphrase.
```
Solution: Check `AGENT_DID_PASSPHRASE` value

**Identity not found:**
```
Error: Identity not found: did:key:...
```
Solution: Verify DID with `openclaw agent-did list`

**Issuer not owner:**
```
Error: Issuer must be an owner: did:key:...
```
Solution: Only owner identities can issue credentials

**File not found:**
```
Error: File not found: /path/to/file.jwt
```
Solution: Check file path exists

## Best Practices

### Security

1. **Always use encryption** - Never use `--no-encryption` in production
2. **Strong passphrases** - Use long, random passphrases (minimum 12 characters)
3. **Secure passphrase storage** - Store `AGENT_DID_PASSPHRASE` in secure vault
4. **Backup keystores** - Regularly backup `~/.agent-did` directory
5. **Time-limited credentials** - Use `--expires` for temporary access
6. **Scoped permissions** - Grant minimal required scopes

### Organizational

1. **Naming conventions** - Use descriptive names (e.g., "Sales Bot", "Data Analyst")
2. **Credential organization** - Store credentials in structured directories
3. **Regular audits** - Periodically review identities with `openclaw agent-did list`
4. **Documentation** - Document which agents have which credentials

### Operational

1. **JSON for automation** - Use `--json` flag when scripting
2. **Keystore compatibility** - Plugin shares keystores with standalone `agent-did` CLI
3. **Verification always** - Always verify credentials before trusting them
4. **Scope specificity** - Use specific scopes (e.g., `api:read`) not generic ones

## Integration Example

Using agent credentials in application:

```typescript
// 1. Load credential from file
const credentialJWT = await fs.readFile('credentials/agent.jwt', 'utf8');

// 2. Extract DID and key from JWT payload
const [header, payload, signature] = credentialJWT.split('.');
const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
const agentDid = decoded.sub;  // Subject DID (agent)
const ownerDid = decoded.iss;  // Issuer DID (owner)

// 3. Verify credential (using OpenClaw)
// This ensures credential is valid and not tampered
const verifyResult = await exec(
  `openclaw agent-did vc verify --file credentials/agent.jwt --json`
);
const { valid } = JSON.parse(verifyResult);

if (!valid) {
  throw new Error('Invalid agent credential');
}

// 4. Use agent DID for authentication
// Include JWT in API requests for service verification
```

## AI Agent Registration Example

How an AI agent autonomously registers with agent-did.xyz using OpenClaw:

```typescript
import { execSync } from 'child_process';
import fetch from 'node-fetch';

/**
 * Autonomous agent registration with agent-did.xyz
 * Agent discovers this pattern from SKILLS.md and executes it
 */
async function registerWithAgentDidXyz() {
  console.log('Starting autonomous registration with agent-did.xyz...');

  // Step 1: Check if agent DID exists
  const listResult = execSync('openclaw agent-did list --json', {
    encoding: 'utf8'
  });
  const identities = JSON.parse(listResult);

  // Find agent identity (not owner)
  const agentIdentity = identities.find((id: any) => id.type === 'agent');

  if (!agentIdentity) {
    throw new Error(
      'No agent DID found. Owner must first run:\n' +
      '  openclaw agent-did create owner --name "Owner"\n' +
      '  openclaw agent-did create agent --name "Agent" --owner <owner-did>'
    );
  }

  const agentDid = agentIdentity.did;
  console.log(`✓ Found agent DID: ${agentDid}`);

  // Step 2: Request registration challenge from service
  console.log('Requesting registration challenge...');
  const initResponse = await fetch('https://agent-did.xyz/api/register/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ did: agentDid })
  });

  if (!initResponse.ok) {
    throw new Error(`Registration init failed: ${initResponse.statusText}`);
  }

  const { challenge } = await initResponse.json();
  console.log(`✓ Challenge received: ${challenge.substring(0, 16)}...`);

  // Step 3: Sign challenge using agent's private key
  console.log('Signing challenge...');
  const authResult = execSync(
    `openclaw agent-did auth sign ` +
    `--did "${agentDid}" ` +
    `--challenge "${challenge}" ` +
    `--audience https://agent-did.xyz ` +
    `--domain agent-did.xyz ` +
    `--expires-in 300 ` +
    `--json`,
    { encoding: 'utf8' }
  );

  const signedAuth = JSON.parse(authResult);
  console.log('✓ Challenge signed');

  // Step 4: Submit signed response to complete registration
  console.log('Completing registration...');
  const completeResponse = await fetch('https://agent-did.xyz/api/register/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedAuth)
  });

  if (!completeResponse.ok) {
    throw new Error(`Registration failed: ${completeResponse.statusText}`);
  }

  const result = await completeResponse.json();
  console.log('✓ Successfully registered with agent-did.xyz');
  console.log(`  Agent ID: ${result.agent_id}`);
  console.log(`  Status: ${result.status}`);

  return result;
}

// Usage
registerWithAgentDidXyz()
  .then(() => console.log('Registration complete!'))
  .catch(err => console.error('Registration failed:', err.message));
```

**Key Features:**
- **Autonomous** - Agent executes without human intervention
- **Self-Discovery** - Agent learns workflow from SKILLS.md
- **Error Handling** - Clear guidance if prerequisites missing
- **Secure** - No hardcoded credentials, uses cryptographic proof
- **Transparent** - Logs each step for observability

## agent-did.xyz API Endpoints

Documentation for services implementing DID-based agent registration:

### Registration Flow

**1. Initialize Registration**
```http
POST https://agent-did.xyz/api/register/init
Content-Type: application/json

{
  "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
}
```

Response:
```json
{
  "challenge": "a1b2c3d4e5f6...",
  "expires_in": 300
}
```

**2. Complete Registration**
```http
POST https://agent-did.xyz/api/register/complete
Content-Type: application/json

{
  "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "kid": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "payload": {
    "nonce": "a1b2c3d4e5f6...",
    "aud": "https://agent-did.xyz",
    "domain": "agent-did.xyz",
    "iat": 1709568000,
    "exp": 1709568300,
    "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
  },
  "payloadEncoded": "eyJub25jZSI6ImExYjJjM2Q0ZTVmNi4uLiIsImF1ZCI6Imh0dHBzOi8vYWdlbnQtZGlkLnh5eiIsImRvbWFpbiI6ImFnZW50LWRpZC54eXoiLCJpYXQiOjE3MDk1NjgwMDAsImV4cCI6MTcwOTU2ODMwMCwiZGlkIjoiZGlkOmtleTp6Nk1raGFYZ0JaRHZvdERrTDUyNTdmYWl6dGlHaUMyUXRLTEdwYm5uRUd0YTJkb0sifQ",
  "signature": "3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d",
  "alg": "EdDSA",
  "createdAt": "2024-03-04T12:00:00.000Z",
  "expiresAt": "2024-03-04T12:05:00.000Z"
}
```

Response:
```json
{
  "registered": true,
  "agent_id": "agent_abc123",
  "status": "active",
  "created_at": "2024-03-04T12:00:00.000Z"
}
```

### Authentication Flow

**1. Request Auth Challenge**
```http
POST https://agent-did.xyz/api/auth/challenge
Content-Type: application/json

{
  "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
}
```

Response:
```json
{
  "challenge": "x9y8z7a6b5c4...",
  "expires_in": 120
}
```

**2. Verify Signed Challenge**
```http
POST https://agent-did.xyz/api/auth/verify
Content-Type: application/json

{
  "did": "did:key:...",
  "payloadEncoded": "...",
  "signature": "...",
  ...
}
```

Response:
```json
{
  "authenticated": true,
  "session_token": "sess_xyz789",
  "expires_in": 3600
}
```

### Error Responses

All endpoints return standard error format:
```json
{
  "error": "invalid_challenge",
  "message": "Challenge has expired or been used",
  "code": 400
}
```

Common error codes:
- `invalid_did` - DID format is invalid
- `invalid_challenge` - Challenge expired or already used
- `invalid_signature` - Signature verification failed
- `agent_not_found` - Agent not registered
- `rate_limit_exceeded` - Too many requests

## Keystore Structure

The keystore is stored at `~/.agent-did/` (or `$AGENT_DID_HOME`):

```
~/.agent-did/
├── index.json              # Identity metadata
└── keys/
    ├── did_key_z6Mk...     # Encrypted private keys
    └── did_key_z6Mk...
```

Keystore is compatible between:
- OpenClaw plugin (`openclaw agent-did`)
- Standalone CLI (`agent-did`)

## Additional Resources

- [W3C DID Specification](https://www.w3.org/TR/did-core/)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [did:key Method Spec](https://w3c-ccg.github.io/did-method-key/)
- [agent-did Documentation](https://agent-did.xyz)

## Troubleshooting

### Plugin not found
```bash
# Reinstall plugin
openclaw plugin install /Users/bernardo/www/casao.dev/agent-did/openclaw-plugin
```

### Commands not working
```bash
# Rebuild plugin
cd /Users/bernardo/www/casao.dev/agent-did/openclaw-plugin
npm install
npm run build
openclaw plugin reload agent-did
```

### Keystore corruption
```bash
# Backup keystore first
cp -r ~/.agent-did ~/.agent-did.backup

# Then reinitialize (creates new keystore)
rm -rf ~/.agent-did
openclaw agent-did create owner --name "Recovery"
```
