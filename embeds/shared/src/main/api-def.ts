import {type ApiDefResolver, HttpMethod, type QueryApi} from '@nu-art/api-types';

export type API_Embeds = {
	/** The loader script (JavaScript, not JSON). Public: add it to the app's openApis. */
	loader: QueryApi<string, {}>;
};

export const ApiDef_Embeds: ApiDefResolver<API_Embeds> = {
	loader: {method: HttpMethod.GET, path: '/embed.js'},
};
