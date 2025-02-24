import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import ErrorHelper from '../helper/errorHelper.js';

dotenv.config();

class CryptoService {
    constructor() {
        this.publicKey = Buffer.from(process.env.PUBLIC_KEY.replace(/\\n/g, '\n'), 'utf-8');
        this.privateKey = Buffer.from(process.env.PRIVATE_KEY.replace(/\\n/g, '\n'), 'utf-8');
        this.aesKey = Buffer.from(process.env.AES_KEY, 'hex');
        this.aesIv = Buffer.from(process.env.AES_IV, 'hex');
    }

    /**
     * Hashes a password using bcrypt.
     * 
     * @param {string} password - The password to hash.
     * @returns {Promise<string>} - A promise that resolves to the hashed password.
     */
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, 12);
        } catch (error) {
            ErrorHelper.throwCryptoError("Neuspelo hashovanje lozinke!");
        }
    }

    /**
     * Compares a plain text password with a hashed password.
     * 
     * @param {string} password - The plain text password.
     * @param {string} hashedPassword - The hashed password.
     * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the passwords match.
     */
    async compareUserPasswords(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            ErrorHelper.throwCryptoError("Greška pri proveri lozinke!");
        }
    }

    /**
     * Creates a reset token using crypto.
     * 
     * @returns {Promise<string>} - A promise that resolves to the generated reset token.
     */
    async createResetToken() {
        try {
            return crypto.randomBytes(32).toString("hex");
        } catch (error) {
            ErrorHelper.throwCryptoError("Neuspelo generisanje tokena!");
        }
    }

    /**
     * Encrypts data using AES-256-CBC.
     * 
     * @param {string} text - The text to encrypt.
     * @returns {string} - The encrypted text.
     */
    encryptData(text) {
        try {
            const cipher = crypto.createCipheriv('aes-256-cbc', this.aesKey, this.aesIv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
        } catch (error) {
            ErrorHelper.throwCryptoError("Neuspelo šifrovanje podataka!");
        }
    }

    /**
     * Decrypts data using AES-256-CBC.
     * 
     * @param {string} encryptedText - The encrypted text to decrypt.
     * @returns {string} - The decrypted text.
     */
    decryptData(encryptedText) {
        try {
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.aesKey, this.aesIv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            ErrorHelper.throwCryptoError("Neuspelo dešifrovanje podataka!");
        }
    }

    // Functions for encryption and decryption of AES key using RSA when setting up app for the first time
    encryptAESKey() {
        try {
            return crypto.publicEncrypt(this.publicKey, this.aesKey).toString('hex');
        } catch (error) {
            ErrorHelper.throwCryptoError("Neuspela enkripcija AES ključa!");
        }
    }

    decryptAESKey(encryptedAESKey) {
        try {
            const aesKeyBuffer = Buffer.from(encryptedAESKey, 'hex');
            return crypto.privateDecrypt(this.privateKey, aesKeyBuffer);
        } catch (error) {
            ErrorHelper.throwCryptoError("Neuspela dekripcija AES ključa!");
        }
    }
}

export default new CryptoService();
