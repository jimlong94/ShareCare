// src/utils/crypto.js
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

// Encrypts text using a secret key (PIN)
export const encryptData = (text, secretKey) => {
  if (!text || !secretKey) return '';
  try {
    return AES.encrypt(text, secretKey).toString();
  } catch (e) {
    console.error("Encryption failed", e);
    return '';
  }
};

// Decrypts text using a secret key (PIN)
export const decryptData = (cipherText, secretKey) => {
  if (!cipherText || !secretKey) return '';
  try {
    const bytes = AES.decrypt(cipherText, secretKey);
    const originalText = bytes.toString(Utf8);
    // If decryption fails due to wrong key, originalText might be empty strings
    return originalText || '*** Decryption Failed (Wrong PIN) ***';
  } catch (e) {
    return '*** Decryption Failed ***';
  }
};