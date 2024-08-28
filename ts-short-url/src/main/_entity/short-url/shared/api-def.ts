import {ApiDefResolver, HttpMethod, QueryApi} from '@thunder-storm/core';
import {DB_BaseObject, Minute} from '@thunder-storm/common';


export type RequestType_ShortUrl = {};
export type ResponseType_ShortUrl = {};

export type GetShortUrlRequest = DB_BaseObject;
export type GetShortUrlResponse = { shortUrl: string };

export type ApiStruct_ShortUrl = {
	_v1: {
		getShortUrl: QueryApi<GetShortUrlResponse, GetShortUrlRequest>
	}
}

export const ApiDef_ShortUrl: ApiDefResolver<ApiStruct_ShortUrl> = {
	_v1: {
		getShortUrl: {method: HttpMethod.GET, path: 'v1/short-url/get-short-url', timeout: Minute}
	}
};
