import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {ApiHandler} from '@nu-art/http-server';
import {HttpCodes} from '@nu-art/api-types';
import {API_BootstrapToken, ApiDef_BootstrapToken, DatabaseDef_Account, DatabaseDef_BootstrapToken, DBDef_BootstrapToken} from '@nu-art/user-account-shared';
import {ModuleBE_JWT, JWT_Handler} from '../session/ModuleBE_JWT.js';
import {RecursiveObjectOfPrimitives} from '@nu-art/ts-common';
import {MemKey_AccountId} from '../session/consts.js';

type BootstrapClaims = {
	tokenId: string;
	accountId: string;
	purpose: 'mcp-bootstrap';
};

type AccountId = DatabaseDef_Account['id'];
type BootstrapTokenId = DatabaseDef_BootstrapToken['id'];

type Config = {
	jwtSigner: {
		secretKey: string;
		projectId?: string;
	};
};

const Year = 365 * 24 * 60 * 60 * 1000;

export class ModuleBE_BootstrapTokenDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_BootstrapToken, Config> {

	private jwtHandler!: JWT_Handler<BootstrapClaims & RecursiveObjectOfPrimitives>;

	constructor() {
		super(DBDef_BootstrapToken);
		this.setDefaultConfig({
			jwtSigner: {
				secretKey: 'jwt-signer--bootstrap-token',
			},
		});
	}

	init() {
		super.init();
		this.jwtHandler = ModuleBE_JWT.jwtHandler<BootstrapClaims>({
			label: 'Bootstrap-JWT',
			ttlInMs: Year,
			rotationIntervalInMs: Year,
			secretKey: this.config.jwtSigner.secretKey,
			projectId: this.config.jwtSigner.projectId,
		});
	}

	async createToken(accountId: AccountId, label: string, metadata?: Record<string, string>): Promise<{ token: string; entity: DatabaseDef_BootstrapToken['dbType'] }> {
		const entity = await this.create.item({
			accountId,
			label,
			metadata,
			revoked: false,
		});

		const jwt = await this.jwtHandler.create({
			tokenId: entity._id,
			accountId,
			purpose: 'mcp-bootstrap',
		}, Year);

		return {token: jwt, entity};
	}

	async validateToken(jwt: string): Promise<{ accountId: AccountId }> {
		const result = await this.jwtHandler.verifySignature(jwt);
		if (!result.validated)
			throw HttpCodes._4XX.UNAUTHORIZED('Invalid bootstrap token');

		const claims = result.claims;
		if (claims.purpose !== 'mcp-bootstrap')
			throw HttpCodes._4XX.UNAUTHORIZED('Token is not a bootstrap token');

		const tokenId = claims.tokenId as BootstrapTokenId;
		const accountId = claims.accountId as AccountId;

		const tokenEntity = await this.query.uniqueAssert(tokenId);
		if (tokenEntity.revoked)
			throw HttpCodes._4XX.UNAUTHORIZED('Bootstrap token has been revoked');

		if (tokenEntity.accountId !== accountId)
			throw HttpCodes._4XX.UNAUTHORIZED('Token account mismatch');

		return {accountId};
	}

	async revokeAllForAccount(accountId: AccountId): Promise<void> {
		const tokens = await this.query.custom({where: {accountId}});
		for (const token of tokens) {
			await this.set.item({...token, revoked: true});
		}
	}

	@ApiHandler(ApiDef_BootstrapToken.create)
	async apiCreateToken(body: API_BootstrapToken['create']['Body']): Promise<API_BootstrapToken['create']['Response']> {
		const accountId = MemKey_AccountId.get();
		const {token} = await this.createToken(accountId, body.label, body.metadata);
		return {token};
	}

	@ApiHandler(ApiDef_BootstrapToken.revoke)
	async apiRevokeTokens(_body: API_BootstrapToken['revoke']['Body']): Promise<void> {
		const accountId = MemKey_AccountId.get();
		await this.revokeAllForAccount(accountId);
	}
}

export const ModuleBE_BootstrapTokenDB = new ModuleBE_BootstrapTokenDB_Class();
