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
import {RecursiveObjectOfPrimitives} from './types';
import {decodeJwt, jwtVerify, SignJWT} from 'jose';
import {exists} from './tools';
import {currentTimeMillis} from './date-time-tools';

// Text encoder instance reused for key derivation
const te = new TextEncoder();

export function randomNumber(range: number) {
	return Math.floor(Math.random() * (range));
}

export function randomObject<T>(items: T[]): T {
	return items[randomNumber(items.length)];
}

export function hashPasswordWithSalt(salt: string | Buffer, password: string | Buffer) {
	return createHmac('sha512', salt)
		.update(password)
		.digest('hex');
}

export type JWT_BaseClaims = {
	iat: number
	exp: number
}

/**
 * Derive an HMAC‑SHA secret key from a raw string.
 * jose APIs expect a Uint8Array key for HS* algorithms.
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
	decode: async <T extends RecursiveObjectOfPrimitives & JWT_BaseClaims>(token: string, secret?: string): Promise<T> => {
		if (secret)
			return JwtTools.verifySignature(token, secret);

		return decodeJwt(token) as T;
	},

	verifySignature: async <T extends RecursiveObjectOfPrimitives & JWT_BaseClaims>(token: string, secret: string): Promise<T> => {
		return (await jwtVerify(token, hmacKey(secret))).payload as T;
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
	 * NOTE: This does **not** verify the signature.
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

	JwtTools.verifySignature = async <T extends RecursiveObjectOfPrimitives & JWT_BaseClaims>(token: string, secret: string): Promise<T> => {
		return (await jwtVerify(token, hmacKey(secret), {currentDate: new Date(currentTimeMillis())})).payload as T;
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

