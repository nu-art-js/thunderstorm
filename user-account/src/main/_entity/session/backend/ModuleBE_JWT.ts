import {SecretKey} from '@nu-art/google-services/backend/modules/ModuleBE_SecretManager';
import {
	addItemToArrayAtIndex,
	AnyPrimitive,
	currentTimeMillis,
	Day,
	filterDuplicates,
	generateHex,
	Hour,
	intervalHandler,
	JwtTools,
	Logger,
	merge,
	Module
} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';


type HandlerConfig = {
	ttl: number
	rotationTTL: number
	maxSecrets: number
}

type Config = {
	rotationCheckInterval: number
	default: HandlerConfig
}

export class JWT_Handler<T extends AnyPrimitive>
	extends Logger {
	private config: HandlerConfig;
	readonly secret;

	constructor(config: HandlerConfig & { label: string, secretKey: string, projectId?: string }) {
		super(config.label);
		this.config = config;
		this.secret = new SecretKey<string[]>(config.secretKey, config.projectId);
	}

	async create(claims: T, ttl = this.config.ttl): Promise<string> {
		const secret = await this.getSecret();
		return await JwtTools.encode<T>(claims, secret[0], {expiresIn: currentTimeMillis() + ttl});
	}

	private async getSecret() {
		return await this.secret.get([generateHex(32)]);
	}

	async rotateSecret(): Promise<string[]> {
		let secret = await this.secret.get([]);
		if (secret.length === 0) {
			secret.push(generateHex(32));
			await this.secret.set(secret);
			return secret;
		}

		if (currentTimeMillis() < (await this.secret.modifiedTimestamp()) + this.config.rotationTTL)
			return secret;

		addItemToArrayAtIndex(secret, generateHex(32), 0);
		secret.length = this.config.maxSecrets;

		await this.secret.set(secret);
		return secret;
	}

	async isExpired(jwt: string) {
		return JwtTools.isValidJWT(jwt);
	}

	async verifySignature(jwt: string): Promise<T> {
		const secrets = await this.getSecret();
		for (const secret of secrets) {
			try {
				return await JwtTools.verifySignature(jwt, secret);
			} catch (ignore) {
			}
		}

		throw HttpCodes._4XX.FORBIDDEN(`Invalid JWT`);
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
				ttl: Hour,
				rotationTTL: Day,
				maxSecrets: 2,
			}
		});
	}

	init() {
		intervalHandler(this.rotateSecrets, this.config.rotationCheckInterval);
	}

	jwtHandler<T extends AnyPrimitive>(jwtConfig: Partial<HandlerConfig> & { label: string, secretKey: string, projectId?: string }) {
		const jwtHandler = new JWT_Handler<T>(merge(this.config.default, jwtConfig));
		this.handlers.push(jwtHandler);
		return jwtHandler;
	}

	async rotateSecrets() {
		await Promise.all(filterDuplicates(this.handlers, handler => `${handler.secret.secret.projectId}/${handler.secret.secret.key}`).map(handler => handler.rotateSecret()));
	}
}


export const ModuleBE_JWT = new ModuleBE_JWT_Class();