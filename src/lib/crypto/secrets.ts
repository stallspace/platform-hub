import CryptoJS from 'crypto-js'

/**
 * Symmetric encryption for vendor payment credentials.
 *
 * Credentials (Yoco secret keys, PayFast passphrases, Ozow private keys, Peach
 * access tokens) are encrypted at rest with AES before being written to
 * `vendor_payment_configs.config_data`. The key lives ONLY on the server in the
 * `PAYMENT_ENCRYPTION_KEY` environment variable and is never sent to the browser.
 *
 * NOTE: All encrypt/decrypt calls must run server-side only.
 */

function getKey(): string {
  const key = process.env.PAYMENT_ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error(
      'PAYMENT_ENCRYPTION_KEY is missing or too short (need >= 32 chars). ' +
        'Payment credentials cannot be encrypted/decrypted.'
    )
  }
  return key
}

/** Encrypt an arbitrary JSON-serialisable object into a single ciphertext string. */
export function encryptJson(obj: Record<string, unknown>): string {
  const plaintext = JSON.stringify(obj)
  return CryptoJS.AES.encrypt(plaintext, getKey()).toString()
}

/** Decrypt a ciphertext string produced by encryptJson back into an object. */
export function decryptJson<T = Record<string, string>>(ciphertext: string): T {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getKey())
  const plaintext = bytes.toString(CryptoJS.enc.Utf8)
  if (!plaintext) throw new Error('Failed to decrypt payment credentials (bad key or corrupt data).')
  return JSON.parse(plaintext) as T
}

/**
 * A `config_data` value is considered encrypted when it is the single-key
 * envelope `{ enc: "<ciphertext>" }`. Older/plaintext rows are handled gracefully
 * so we can migrate without downtime.
 */
export function isEncryptedEnvelope(config: unknown): config is { enc: string } {
  return (
    typeof config === 'object' &&
    config !== null &&
    Object.keys(config as object).length === 1 &&
    typeof (config as { enc?: unknown }).enc === 'string'
  )
}

/** Wrap a plaintext config object into an encrypted envelope for storage. */
export function toEncryptedEnvelope(config: Record<string, string>): { enc: string } {
  return { enc: encryptJson(config) }
}

/**
 * Read a `config_data` value from the DB and return the plaintext config object.
 * Transparently supports both the new encrypted envelope and legacy plaintext rows.
 */
export function readConfigData(configData: unknown): Record<string, string> {
  if (isEncryptedEnvelope(configData)) {
    return decryptJson<Record<string, string>>(configData.enc)
  }
  // Legacy plaintext row — return as-is so nothing breaks during migration.
  return (configData ?? {}) as Record<string, string>
}

/** Mask a secret value for display, showing only the last 4 characters. */
export function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 4) return '••••'
  return '••••••' + value.slice(-4)
}
