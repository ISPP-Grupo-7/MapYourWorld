/**
 * Módulo de seguridad para cifrado y hash
 * Ofrece funciones para cifrar datos, descifrar y generar hashes seguros
 */

import * as crypto from 'crypto';

// Constantes para cifrado
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
}

const ALGORITHM = 'aes-256-cbc';

/**
 * Cifra un texto usando AES
 * @param text El texto a cifrar
 * @returns El texto cifrado
 */
export const encryptAES = (text: string): string => {
  try {
    const iv = crypto.randomBytes(16); // IV aleatorio

    // Derivar clave con PBKDF2 (más seguro que sha256)
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, 'some-salt', 100000, 32, 'sha256');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Devolver IV y texto cifrado concatenados
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Error al cifrar:', error);
    throw new Error('No se pudo cifrar el texto');
  }
};

/**
 * Descifra un texto cifrado con AES
 * @param encryptedText El texto cifrado
 * @returns El texto descifrado
 */
export const decryptAES = (encryptedText: string): string => {
  try {
    // Separar IV y texto cifrado
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Formato de texto cifrado inválido');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, 'some-salt', 100000, 32, 'sha256');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error al descifrar:', error);
    return ''; // Devolver cadena vacía en caso de error
  }
};

/**
 * Genera un hash SHA-256 
 * @param text Texto a hashear
 * @returns Hash en formato hexadecimal
 */
export const generateSHA256 = (text: string): string => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Genera un hash SHA-512
 * @param text Texto a hashear
 * @returns Hash en formato hexadecimal
 */
export const generateSHA512 = (text: string): string => {
  return crypto.createHash('sha512').update(text).digest('hex');
};

/**
 * Cifra una contraseña con un salt
 * @param password Contraseña a cifrar
 * @param existingSalt Salt existente (opcional)
 * @returns Objeto con el hash y el salt
 */
export const hashPassword = (password: string, existingSalt?: string): { hash: string; salt: string } => {
  // Generar salt si no se proporcionó uno
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
};

/**
 * Verifica si una contraseña coincide con un hash
 * @param password Contraseña a verificar
 * @param hash Hash guardado
 * @param salt Salt utilizado
 * @returns true si la contraseña coincide
 */
export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const hashVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashVerify, 'hex'));
};

/**
 * Genera un token seguro aleatorio
 * @param length Longitud del token (por defecto 48 bytes)
 * @returns Token en formato hexadecimal
 */
export const generateSecureToken = (length = 48): string => {
  return crypto.randomBytes(length).toString('hex');
};