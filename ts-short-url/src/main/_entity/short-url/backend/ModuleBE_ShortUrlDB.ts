import {ApiDef_ShortUrl, DBDef_ShortUrl, DBProto_ShortUrl, GetShortUrlRequest, GetShortUrlResponse} from '../shared';
import {addRoutes, createQueryServerApi, DBApiConfigV3, ModuleBE_BaseDB} from '@nu-art/thunderstorm/backend';
import {generateShortURL} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';


type Config = DBApiConfigV3<DBProto_ShortUrl> & {
	BaseShortUrl: string
}

export class ModuleBE_ShortUrlDB_Class
	extends ModuleBE_BaseDB<DBProto_ShortUrl, Config> {

	constructor() {
		super(DBDef_ShortUrl);
	}

	init() {
		super.init();
		addRoutes([
			createQueryServerApi(ApiDef_ShortUrl._v1.getShortUrl, this.getShortUrl)
		]);
	}

	private getShortUrl = async (request: GetShortUrlRequest): Promise<GetShortUrlResponse> => {
		const dbDoc = await this.query.unique(request._id);

		if (!dbDoc)
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR(`db doc with id ${request._id} not found`);

		return {
			shortUrl: `${this.config.BaseShortUrl}${dbDoc._shortUrl}`
		};
	};

	protected async preWriteProcessing(dbInstance: DBProto_ShortUrl['uiType'], originalDbInstance: DBProto_ShortUrl['dbType'], transaction?: FirebaseFirestore.Transaction) {
		if (!dbInstance._shortUrl)
			dbInstance._shortUrl = generateShortURL();
	}
}

export const ModuleBE_ShortUrlDB = new ModuleBE_ShortUrlDB_Class();

