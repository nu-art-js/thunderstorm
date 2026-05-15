import {generateHex, Hour} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_PasswordResetToken, DB_PasswordResetToken, DBDef_PasswordResetToken} from '@nu-art/password-auth-shared';
import {HttpCodes} from '@nu-art/api-types';
import {DB_Account} from '@nu-art/user-account-shared';

type Config = {
	ttlMs: number;
	maxRequestsPerHour: number;
};

export class ModuleBE_PasswordResetTokenDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PasswordResetToken> {

	private tokenConfig: Config = {ttlMs: 24 * Hour, maxRequestsPerHour: 3};

	constructor() {
		super(DBDef_PasswordResetToken);
	}

	setTokenConfig(config: Partial<Config>) {
		Object.assign(this.tokenConfig, config);
	}

	async createToken(accountId: DB_Account['_id']): Promise<DB_PasswordResetToken> {
		await this.assertRateLimit(accountId);
		await this.invalidateExisting(accountId);

		return this.create.item({
			accountId,
			token: generateHex(64),
			expiresAt: Date.now() + this.tokenConfig.ttlMs,
		});
	}

	async assertToken(token: string): Promise<DB_PasswordResetToken> {
		const results = await this.query.custom({where: {token}, limit: 1});
		const resetToken = results[0];
		if (!resetToken)
			throw HttpCodes._4XX.BAD_REQUEST('Invalid or expired reset token');

		if (resetToken.consumedAt)
			throw HttpCodes._4XX.BAD_REQUEST('Reset token has already been used');

		if (resetToken.expiresAt < Date.now())
			throw HttpCodes._4XX.BAD_REQUEST('Reset token has expired');

		return resetToken;
	}

	async consumeToken(token: DB_PasswordResetToken): Promise<DB_PasswordResetToken> {
		return this.set.item({...token, consumedAt: Date.now()});
	}

	async invalidateExisting(accountId: DB_Account['_id']): Promise<void> {
		const existing = await this.query.custom({where: {accountId}});
		const now = Date.now();
		for (const token of existing) {
			if (token.consumedAt)
				continue;

			await this.set.item({...token, consumedAt: now});
		}
	}

	private async assertRateLimit(accountId: DB_Account['_id']): Promise<void> {
		const oneHourAgo = Date.now() - Hour;
		const recentTokens = await this.query.custom({
			where: {accountId, __created: {$gt: oneHourAgo}},
		});
		if (recentTokens.length >= this.tokenConfig.maxRequestsPerHour)
			throw HttpCodes._4XX.TOO_MANY_REQUESTS('Too many password reset requests. Please try again later.');
	}
}

export const ModuleBE_PasswordResetTokenDB = new ModuleBE_PasswordResetTokenDB_Class();
