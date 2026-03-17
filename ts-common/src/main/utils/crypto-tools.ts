/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {createHmac} from 'crypto';
import {RecursiveObjectOfPrimitives} from './types.js';
import {decodeJwt, jwtVerify, SignJWT} from 'jose';
import {exists} from './tools.js';
import {currentTimeMillis} from './date-time-tools.js';

// Text encoder instance reused for key derivation
const te = new TextEncoder();

/**
 * Generates a random integer in the range [0, range).
 *
 * **Note**: Uses `Math.random()` which is not cryptographically secure.
 * For security-sensitive use cases, use a cryptographically secure random number generator.
 *
 * @param range - Upper bound (exclusive)
 * @returns Random integer from 0 to range-1
 */
export function randomNumber(range: number) {
	return Math.floor(Math.random() * (range));
}

/**
 * Selects a random element from an array.
 *
 * **Note**: Uses `Math.random()` which is not cryptographically secure.
 *
 * @param items - Array to select from
 * @returns Random element from the array
 */
export function randomObject<T>(items: T[]): T {
	return items[randomNumber(items.length)];
}

/**
 * Hashes a password with a salt using HMAC-SHA512.
 *
 * Uses HMAC (Hash-based Message Authentication Code) with SHA-512 for password hashing.
 * The salt should be unique per password and stored alongside the hash.
 *
 * **Security Note**: This is a basic hashing function. For production password storage,
 * consider using bcrypt, scrypt, or Argon2 which are specifically designed for password hashing.
 *
 * @param salt - Salt value (string or Buffer)
 * @param password - Password to hash (string or Buffer)
 * @returns Hexadecimal hash string
 */
export function hashPasswordWithSalt(salt: string | Buffer, password: string | Buffer) {
	return createHmac('sha512', salt)
		.update(password)
		.digest('hex');
}

/**
 * Base JWT claims that are automatically added to all tokens.
 */
export type JWT_BaseClaims = {
	/** Issued at time (epoch seconds) */
	iat: number
	/** Expiration time (epoch seconds) */
	exp: number
}

/**
 * Derives an HMAC‑SHA secret key from a raw string.
 *
 * Converts a string secret to a Uint8Array as required by jose library
 * for HMAC-based algorithms (HS256, HS384, HS512).
 *
 * @param secret - Secret string
 * @returns Uint8Array key
 */
const hmacKey = (secret: string) => te.encode(secret);

/** Options for encoding a JWT */
export interface EncodeJWT_Options {
	/** Expiration – e.g. '1h', '10m', or absolute epoch seconds */
	expiresIn?: string | number;
	/** Signing algorithm – defaults to 'HS256'. Examples: 'RS256', 'ES256', 'EdDSA' */
	alg?: string;
}

export const JwtTools = {
	/**
	 * Create a signed JWT.
	 * @param data     Payload to embed in the token.
	 * @param secret   Shared secret (HS*) **or** private key (other algs).
	 * @param options  Optional `expiresIn` and `alg` (defaults to 'HS256'). If
	 *                 `expiresIn` is omitted, a 1‑hour token is issued.
	 */
	encode: async <T extends RecursiveObjectOfPrimitives>(data: T, secret: string, options?: EncodeJWT_Options): Promise<string> => {
		return new SignJWT(data as any)
			.setProtectedHeader({alg: options?.alg ?? 'HS256', type: 'JWT'})
			.setIssuedAt()
			.setExpirationTime(options?.expiresIn ?? '1h')
			.sign(hmacKey(secret));
	},

	/**
	 * Decode a JWT.
	 * – If `secret` is provided, verify signature and registered claims.
	 * – If omitted, only parse Base64Url segments (⚠️ no integrity check).
	 */
	decode: async <T extends RecursiveObjectOfPrimitives>(token: string, secret?: string): Promise<T & JWT_BaseClaims> => {
		if (secret)
			return JwtTools.verifySignature(token, secret);

		return decodeJwt(token) as T & JWT_BaseClaims;
	},

	verifySignature: async <T extends RecursiveObjectOfPrimitives>(token: string, secret: string): Promise<T & JWT_BaseClaims> => {
		return (await jwtVerify(token, hmacKey(secret))).payload as T & JWT_BaseClaims;
	},


	/**
	 * Extract the `iat` (Issued‑At) claim from a token without verifying.
	 * @returns Epoch seconds or `undefined` if the claim is missing / malformed.
	 */
	getCreationTime: async (token: string): Promise<number | undefined> => {
		try {
			const {iat} = decodeJwt(token);
			return typeof iat === 'number' ? iat : undefined;
		} catch {
			return undefined;
		}
	},

	/**
	 * Lightweight client‑side freshness check based on the `exp` claim.
	 *
	 * **Security Warning**: This does **not** verify the signature. It only checks
	 * the expiration claim. An attacker could forge a token with a future expiration.
	 * Always use `verifySignature()` or `decode()` with a secret for security-critical operations.
	 *
	 * @param token - JWT token string
	 * @returns true if token is not expired, false otherwise (or if token is invalid)
	 */
	isJwtActive: async (token: string): Promise<boolean> => {
		try {
			const {exp} = decodeJwt(token);
			if (!exists(exp))
				return false;

			const now = Math.floor(currentTimeMillis() / 1000);
			return exp > now;
		} catch (err) {
			// Preserve original behaviour: swallow errors and report invalid.
			// this.logError?.('Error validating session token', err);
			return false;
		}
	},
	/**
	 * Checks if a JWT token is expired.
	 *
	 * **Security Warning**: This does **not** verify the signature. See `isJwtActive()` for details.
	 *
	 * @param token - JWT token string
	 * @returns true if token is expired or invalid, false if still active
	 */
	isJwtExpired: async (token: string): Promise<boolean> => {
		return !(await JwtTools.isJwtActive(token));
	}
};

const originalJwtTools_encode = JwtTools.encode;
const originalJwtTools_verifySignature = JwtTools.verifySignature;

const TEST_JwtTools_BeforeAll = () => {
	JwtTools.encode = async <T extends RecursiveObjectOfPrimitives>(data: T, secret: string, options?: EncodeJWT_Options): Promise<string> => {
		return new SignJWT(data as any)
			.setProtectedHeader({alg: options?.alg ?? 'HS256', type: 'JWT'})
			.setIssuedAt(Math.floor(currentTimeMillis() / 1000))
			.setExpirationTime(options?.expiresIn ?? '1h')
			.sign(hmacKey(secret));
	};

	JwtTools.verifySignature = async <T extends RecursiveObjectOfPrimitives>(token: string, secret: string): Promise<T & JWT_BaseClaims> => {
		return (await jwtVerify(token, hmacKey(secret), {currentDate: new Date(currentTimeMillis())})).payload as T & JWT_BaseClaims;
	};
};

const TEST_JwtTools_AfterAll = () => {
	JwtTools.encode = originalJwtTools_encode;
	JwtTools.verifySignature = originalJwtTools_verifySignature;
};

export const TEST_JwtTools = {
	beforeAll: TEST_JwtTools_BeforeAll,
	afterAll: TEST_JwtTools_AfterAll,
};

