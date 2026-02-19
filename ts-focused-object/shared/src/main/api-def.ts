import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import {FocusedEntity} from './types.js';

export type API_FocusedObject = {
	update: BodyApi<void, { focusedEntities: FocusedEntity[] }>;
};

export const ApiDef_FocusedObject: ApiDefResolver<API_FocusedObject> = {
	update: {method: HttpMethod.POST, path: '/v1/focus-object/update'},
};
