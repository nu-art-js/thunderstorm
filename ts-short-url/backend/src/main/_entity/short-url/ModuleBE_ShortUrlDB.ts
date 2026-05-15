import {
	API_ShortUrl,
	ApiDef_ShortUrl,
	DBDef_ShortUrl,
	DB_ShortUrl,
	DatabaseDef_ShortUrl,
	UI_ShortUrl
} from '@nu-art/ts-short-url-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {ApiHandler} from '@nu-art/http-server';
import {generateShortURL} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/api-types';

type Config = {
	BaseShortUrl: string;
};

export class ModuleBE_ShortUrlDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_ShortUrl, Config> {

	constructor() {
		super(DBDef_ShortUrl);
	}

	init() {
		super.init();
	}

	@ApiHandler(ApiDef_ShortUrl.getShortUrl)
	async getShortUrl(params: API_ShortUrl['getShortUrl']['Params']): Promise<API_ShortUrl['getShortUrl']['Response']> {
		const dbDoc = await this.query.unique(params._id);

		if (!dbDoc)
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR(`db doc with id ${params._id} not found`);

		return {
			shortUrl: `${this.config.BaseShortUrl}${dbDoc._shortUrl}`
		};
	}

	protected async preWriteProcessing(dbInstance: UI_ShortUrl, originalDbInstance: DB_ShortUrl) {
		if (!dbInstance._shortUrl)
			dbInstance._shortUrl = generateShortURL();
	}
}

export const ModuleBE_ShortUrlDB = new ModuleBE_ShortUrlDB_Class();
