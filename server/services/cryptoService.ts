import crypto from 'crypto';
import QRCode from 'qrcode';

// Base32 RFC 4648 alphabet used by Google Authenticator
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export class CryptoService {
  private static getEncryptionKey(): Buffer {
    const rawKey = process.env.ENCRYPTION_KEY || 'AuthShield-360-VerifyVault-AES256-GCM-SecurityKey-2026';
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts plaintext using AES-256-GCM authenticated encryption.
   * Format: iv:authTag:ciphertext (all in hex)
   */
  public static encrypt(plainText: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts AES-256-GCM ciphertext. Verifies integrity tag.
   */
  public static decrypt(cipherText: string): string {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format.');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = this.getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encodes a Buffer to a Base32 string (RFC 4648).
   */
  public static base32Encode(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
  }

  /**
   * Decodes a Base32 string into a Buffer.
   */
  public static base32Decode(base32Str: string): Buffer {
    const cleaned = base32Str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (let i = 0; i < cleaned.length; i++) {
      const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
      if (idx === -1) {
        throw new Error(`Invalid Base32 character: ${cleaned[i]}`);
      }

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }

  /**
   * Generates a 20-byte (160-bit) cryptographically random Base32 TOTP secret.
   */
  public static generateTotpSecret(): string {
    const randomBytes = crypto.randomBytes(20);
    return this.base32Encode(randomBytes);
  }

  /**
   * Computes the 6-digit TOTP code for a given time step according to RFC 6238.
   */
  public static generateTotpCode(secretBase32: string, timeStep: number): string {
    const key = this.base32Decode(secretBase32);
    
    // Counter is 8-byte big-endian integer
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(timeStep), 0);

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(counterBuffer);
    const digest = hmac.digest();

    // Dynamic truncation per RFC 4226 / RFC 6238
    const offset = digest[digest.length - 1] & 0x0f;
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  /**
   * Verifies a 6-digit TOTP code with clock-drift tolerance of +/- 1 window (30s).
   * Prevents replay attacks by checking against lastVerifiedStep.
   */
  public static verifyTotp(
    secretBase32: string,
    token: string,
    lastVerifiedStep?: number
  ): { valid: boolean; verifiedStep?: number; error?: string } {
    const cleanToken = token.trim();
    if (!/^\d{6}$/.test(cleanToken)) {
      return { valid: false, error: 'Authentication code must be exactly 6 numeric digits.' };
    }

    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const window = 1; // Check step - 1, step, step + 1

    for (let step = currentStep - window; step <= currentStep + window; step++) {
      const expectedCode = this.generateTotpCode(secretBase32, step);
      if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expectedCode))) {
        // Replay check
        if (lastVerifiedStep !== undefined && step <= lastVerifiedStep) {
          return { valid: false, error: 'This authenticator code has already been used. Please wait for the next 30-second code.' };
        }
        return { valid: true, verifiedStep: step };
      }
    }

    return { valid: false, error: 'Invalid Google Authenticator code. Check your app and try again.' };
  }

  /**
   * Creates an otpauth URL for Google Authenticator.
   */
  public static getOtpAuthUri(email: string, secretBase32: string, issuer: string = 'AuthShield360'): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Generates a QR Code as a Data URL (PNG).
   */
  public static async generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
    return QRCode.toDataURL(otpauthUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 260,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }
}
