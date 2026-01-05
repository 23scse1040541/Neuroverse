import crypto from 'crypto';

const keyBase64 = process.env.ENCRYPTION_KEY_BASE64 || '';
let key;
if (keyBase64) {
  const buf = Buffer.from(keyBase64, 'base64');
  if (buf.length !== 32) {
    console.warn('ENCRYPTION_KEY_BASE64 must be 32 bytes (base64 of 256-bit key). Using derived fallback (DO NOT USE IN PROD).');
    key = crypto.createHash('sha256').update(keyBase64).digest();
  } else key = buf;
} else {
  console.warn('Missing ENCRYPTION_KEY_BASE64. Using ephemeral key (DO NOT USE IN PROD).');
  key = crypto.randomBytes(32);
}

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    contentEnc: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  };
}

export function decrypt({ contentEnc, iv, tag }) {
  const ivBuf = Buffer.from(iv, 'base64');
  const tagBuf = Buffer.from(tag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuf);
  decipher.setAuthTag(tagBuf);
  const dec = Buffer.concat([decipher.update(Buffer.from(contentEnc, 'base64')), decipher.final()]);
  return dec.toString('utf8');
}
