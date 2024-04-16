import {ModuleBE_ExpressFunction_V2} from '@nu-art/firebase/backend';
import {Express, Response} from 'express';
import {tsValidateResult, tsValidateShortUrl} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {ModuleBE_ShortUrlDB} from '../../_entity/short-url/backend';
import {HttpsFunction} from 'firebase-functions/v2/https';

class Module_ShortUrlResolver_Class
	extends ModuleBE_ExpressFunction_V2 {

	constructor(name: string = 'url') {
		super(name);
		this.setDefaultConfig({options: {}});
		this.setName(name);
	}

	private handleError = (res: Response, message: string) => {
		res.status(HttpCodes._5XX.INTERNAL_SERVER_ERROR.code).send(message);
	};

	protected createFunction(_express: Express): HttpsFunction {
		_express.get('/*', async (req, res) => {
			const path = req.path.slice(1);

			const validationResult = tsValidateResult(path, tsValidateShortUrl());
			if (validationResult)
				return this.handleError(res, `invalid Url ${validationResult}`);

			const dbShortUrl = (await ModuleBE_ShortUrlDB.query.where({_shortUrl: path}))[0];

			if (!dbShortUrl)
				return this.handleError(res, `short url with path ${path} not found`);

			//Handle url params
			const url = new URL(dbShortUrl.fullUrl);
			const queryParams = new URLSearchParams(req.query as Record<string, string>);

			queryParams.forEach((value, key) => {
				if (!url.searchParams.has(key)) {
					url.searchParams.append(key, value);
				}
			});

			return res.status(HttpCodes._3XX.MOVED_PERMANENTLY).redirect(url.toString());
		});

		return super.createFunction(_express);
	}
}

export const Module_ShortUrlResolver = new Module_ShortUrlResolver_Class();