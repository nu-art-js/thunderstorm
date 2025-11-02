import {SecretKey} from '@nu-art/google-services/backend/modules/ModuleBE_SecretManager';
import {
	currentTimeMillis,
	Day,
	filterDuplicates,
	generateHex,
	Hour,
	intervalHandler,
	JWT_BaseClaims,
	JwtTools,
	Logger,
	merge,
	Module,
	MUSTNeverHappenException,
	RecursiveObjectOfPrimitives
} from '@nu-art/ts-common';


type HandlerConfig = {
	ttlInMs: number
	rotationIntervalInMs: number
	maxSecrets: number
}

type Config = {
	rotationCheckInterval: number
	default: HandlerConfig
}

export class JWT_Handler<T extends RecursiveObjectOfPrimitives>
	extends Logger {
	private config: HandlerConfig;
	readonly secret;
	private cache?: string[];

	constructor(config: HandlerConfig & { label: string, secretKey: string, projectId?: string }) {
		super(config.label);
		this.config = config;
		this.secret = new SecretKey<string[]>(config.secretKey, config.projectId);
	}

	async create(claims: T, ttlInMs = this.config.ttlInMs): Promise<string> {
		const secret = await this.getSecret();
		return await JwtTools.encode<T>(claims, secret[0], {expiresIn: Math.floor((currentTimeMillis() + ttlInMs) / 1000)});
	}

	private async getSecret() {
		if (this.cache)
			return this.cache;

		return this.cache = await this.secret.get([generateHex(32)]);
	}

	async rotateSecret(): Promise<string[]> {
		delete this.cache;

		let secret = await this.getSecret();
		if (currentTimeMillis() < (await this.secret.modifiedTimestamp()) + this.config.rotationIntervalInMs)
			return secret;

		secret = [generateHex(32), ...secret];
		if (secret.length > this.config.maxSecrets)
			secret.length = this.config.maxSecrets;

		await this.secret.set(secret);
		return secret;
	}

	async isActive(jwt: string) {
		return await JwtTools.isJwtActive(jwt);
	}

	async isExpired(jwt: string) {
		return await JwtTools.isJwtExpired(jwt);
	}

	async verifySignature(jwt: string): Promise<{ validated: true, claims: T & JWT_BaseClaims } | { validated: false }> {
		jwt = jwt.replace(/^Bearer\s/, '');
		const secrets = await this.getSecret();
		this.logWarning(`Verifying JWT signature with secrets:`, secrets, jwt);

		for (const secret of secrets) {
			try {
				return {validated: true, claims: await JwtTools.verifySignature(jwt, secret,)};
			} catch (ignore: any) {
				this.logError('Error verifying JWT signature', ignore);
			}
		}

		return {validated: false};
	}

	async assert(jwt: string): Promise<T & JWT_BaseClaims> {
		if (await this.isExpired(jwt))
			throw new MUSTNeverHappenException(`JWT is expired: ${jwt}`);

		const result = await this.verifySignature(jwt);
		if (!result.validated)
			throw new MUSTNeverHappenException(`JWT signature is invalid: ${jwt}`);

		return result.claims;
	}
}

export class ModuleBE_JWT_Class
	extends Module<Config> {

	private readonly handlers: JWT_Handler<any>[] = [];

	constructor() {
		super();
		this.setDefaultConfig({
			rotationCheckInterval: Hour,
			default: {
				ttlInMs: Hour,
				rotationIntervalInMs: Day,
				maxSecrets: 2,
			}
		});
	}

	init() {
		intervalHandler(this.rotateSecrets, this.config.rotationCheckInterval);
	}

	jwtHandler<T extends RecursiveObjectOfPrimitives>(jwtConfig: Partial<HandlerConfig> & { label: string, secretKey: string, projectId?: string }) {
		const jwtHandler = new JWT_Handler<T>(merge(this.config.default, jwtConfig));
		this.handlers.push(jwtHandler);
		return jwtHandler;
	}

	async rotateSecrets() {
		await Promise.all(filterDuplicates(this.handlers, handler => `${handler.secret.secret.projectId}/${handler.secret.secret.key}`).map(handler => handler.rotateSecret()));
	}
}


export const ModuleBE_JWT = new ModuleBE_JWT_Class();