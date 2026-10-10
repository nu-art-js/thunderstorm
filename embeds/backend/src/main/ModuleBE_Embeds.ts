import {randomUUID} from 'node:crypto';
import {HttpCodes} from '@nu-art/api-types';
import {ModuleBE_SecretManager} from '@nu-art/google-services-backend';
import {
	DefaultEmbedOriginLimit,
	embedLoaderJs,
	type EmbedLoaderOptions,
	type EmbedSubjectState,
	type EmbedTokenClaims,
	frameAncestorsCsp,
	intersectEmbedOrigins,
	parseEmbedOriginList
} from '@nu-art/embeds-shared';
import {ImplementationMissingException, Module} from '@nu-art/ts-common';
import {signHs256, verifyHs256} from './hs256.js';

type Config = {
	/** Secret Manager secret holding the HMAC signing key, stored raw. */
	signingKeySecretName: string;
	/** Token lifetime. Long by default: a pasted snippet stays valid until the app bumps the subject version. */
	tokenTtlSeconds: number;
	originLimit: number;
	/** Loader settings (frame path, first-party origins, bundle). */
	loader: EmbedLoaderOptions;
};

/**
 * The app's current state of a subject (its allowed origins and version), read with the caller's
 * permission-aware queries. Return undefined when the subject does not exist or is not embeddable.
 */
export type EmbedSubjectResolver = (subject: string) => Promise<EmbedSubjectState | undefined>;

export type EmbedFrameAuthorization = {
	claims: EmbedTokenClaims;
	/** Token origins still allowed by the app. */
	origins: string[];
	/** Value for the framed page's Content-Security-Policy (frame-ancestors). */
	frameAncestors: string;
};

const TenYears = 10 * 365 * 24 * 60 * 60;

export class ModuleBE_Embeds_Class
	extends Module<Config> {

	private signingKey?: Promise<string>;
	private subjectResolver?: EmbedSubjectResolver;

	constructor() {
		super();
		this.setDefaultConfig({
			signingKeySecretName: 'embed-signing-key',
			tokenTtlSeconds: TenYears,
			originLimit: DefaultEmbedOriginLimit,
			loader: {framePath: '/embed/frame'},
		});
	}

	setSubjectResolver(resolver: EmbedSubjectResolver) {
		this.subjectResolver = resolver;
	}

	/** Issues a token for a subject and the origins allowed to frame it (validated, at most originLimit). */
	async createToken(input: { subject: string; origins: unknown; version: number; now?: number }): Promise<{ token: string; claims: EmbedTokenClaims }> {
		if (!input.subject)
			throw HttpCodes._4XX.BAD_REQUEST('Missing subject', 'Embed token needs a subject');

		const iat = Math.floor((input.now ?? Date.now()) / 1000);
		const claims: EmbedTokenClaims = {
			purpose: 'embed',
			subject: input.subject,
			origins: parseEmbedOriginList(input.origins, this.config.originLimit),
			ver: input.version,
			jti: randomUUID(),
			iat,
			exp: iat + this.config.tokenTtlSeconds,
		};
		return {token: signHs256({...claims}, await this.getSigningKey()), claims};
	}

	/** Signature, purpose, claim shapes and expiry. Throws 401 on any failure. */
	async verifyToken(token: string, now = Date.now()): Promise<EmbedTokenClaims> {
		const invalid = (reason: string) => HttpCodes._4XX.UNAUTHORIZED('Embed token is invalid', reason);
		if (!token)
			throw invalid('missing');

		let payload: Record<string, unknown>;
		try {
			payload = verifyHs256(token, await this.getSigningKey());
		} catch (e) {
			throw invalid((e as Error).message);
		}

		const {purpose, subject, origins, ver, jti, iat, exp} = payload;
		if (purpose !== 'embed')
			throw invalid('not an embed token');

		if (typeof subject !== 'string' || !subject || !Array.isArray(origins) || !origins.every(o => typeof o === 'string')
			|| !Number.isInteger(ver) || typeof jti !== 'string' || !jti || typeof iat !== 'number' || typeof exp !== 'number')
			throw invalid('missing claims');

		if (exp <= Math.floor(now / 1000))
			throw invalid('expired');

		return {purpose, subject, origins: origins as string[], ver: ver as number, jti, iat, exp};
	}

	/**
	 * For the framed page: verifies the token, checks it against the subject's current version
	 * (revocation) and returns the origins still allowed plus the frame-ancestors policy.
	 */
	async authorizeFrame(token: string, now = Date.now()): Promise<EmbedFrameAuthorization> {
		const claims = await this.verifyToken(token, now);
		if (!this.subjectResolver)
			throw new ImplementationMissingException('ModuleBE_Embeds needs setSubjectResolver() before authorizing frames');

		const state = await this.subjectResolver(claims.subject);
		if (!state || state.version !== claims.ver)
			throw HttpCodes._4XX.UNAUTHORIZED('Embed token is invalid', 'revoked');

		const origins = intersectEmbedOrigins(claims.origins, state.origins);
		if (origins.length === 0)
			throw HttpCodes._4XX.FORBIDDEN('Embed not allowed', 'No origin of this token is still allowed');

		return {claims, origins, frameAncestors: frameAncestorsCsp(origins)};
	}

	/** The loader script for this deployment. */
	loaderJs(): string {
		return embedLoaderJs(this.config.loader);
	}

	/** Reads the raw signing key from Secret Manager once. Fails loudly when it is missing. */
	protected async loadSigningKey(): Promise<string> {
		const projectId = process.env.GCP_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
		if (!projectId)
			throw new ImplementationMissingException('Missing GCP_PROJECT_ID / GCLOUD_PROJECT to read the embed signing key');

		const key = (await ModuleBE_SecretManager.tryGetSecretValue({key: this.config.signingKeySecretName, projectId, version: 'latest'}))?.trim();
		if (!key || key.length < 32)
			throw new ImplementationMissingException(`Missing or short (<32 chars) embed signing key '${this.config.signingKeySecretName}'`);

		return key;
	}

	private getSigningKey(): Promise<string> {
		if (!this.signingKey)
			this.signingKey = this.loadSigningKey().catch((e: Error) => {
				this.signingKey = undefined;
				throw e;
			});

		return this.signingKey;
	}
}

export const ModuleBE_Embeds = new ModuleBE_Embeds_Class();
