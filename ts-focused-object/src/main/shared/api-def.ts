import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';
import {FocusData_Map} from './types';

export type Request_UpdateFocusObject = {
	currentFocusMap: FocusData_Map
}
export type ApiStruct_FocusedObject = {
	_v1: {
		updateFocusObject: BodyApi<void, Request_UpdateFocusObject>,
	}
}

export const ApiDef_FocusedObject: ApiDefResolver<ApiStruct_FocusedObject> = {
	_v1: {
		updateFocusObject: {method: HttpMethod.POST, path: '/v1/fhir/test'},
	}
};
