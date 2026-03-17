import {ApiDefResolver, HttpMethod, QueryApi} from '@nu-art/api-types';
import {DB_BaseObject} from '@nu-art/db-api-shared';
import {Minute} from '@nu-art/ts-common';

export type GetShortUrlRequest = DB_BaseObject<'short-url'>;
export type GetShortUrlResponse = { shortUrl: string };

export type API_ShortUrl = {
	getShortUrl: QueryApi<GetShortUrlResponse, GetShortUrlRequest>;
};

export const ApiDef_ShortUrl: ApiDefResolver<API_ShortUrl> = {
	getShortUrl: {method: HttpMethod.GET, path: '/v1/short-url/get-short-url', timeout: Minute}
};
