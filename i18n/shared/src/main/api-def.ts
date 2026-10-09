import {HttpMethod, type ApiDefResolver, type QueryApi} from '@nu-art/api-types';
import type {I18N_LocaleCatalog} from './catalog.js';

export type API_I18n = {
	/** The defaults catalog of one enabled locale. Public pages need it: add it to the app's openApis. */
	catalog: QueryApi<I18N_LocaleCatalog, { locale: string }>;
};

export const ApiDef_I18n: ApiDefResolver<API_I18n> = {
	catalog: {method: HttpMethod.GET, path: '/v1/i18n/catalog'},
};
