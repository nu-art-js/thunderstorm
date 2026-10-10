import {HttpMethod, type ApiDefResolver, type QueryApi} from '@nu-art/api-types';
import type {I18nLocaleTexts} from './resolve.js';

export type API_I18n = {
	/** One enabled locale's texts (defaults and overrides). Public pages need it: add it to the app's openApis. */
	catalog: QueryApi<I18nLocaleTexts, { locale: string }>;
};

export const ApiDef_I18n: ApiDefResolver<API_I18n> = {
	catalog: {method: HttpMethod.GET, path: '/v1/i18n/catalog'},
};
