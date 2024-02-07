import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';
import {Focused} from './types';

export type Request_UpdateFocusObject = {
	focusData: Focused[]
	tabId: string
}
export type Request_ReleaseObject = {
	objectsToRelease: Focused[]
	tabId: string
}
export type Request_UnfocusTabId = {
	tabId: string
}
export type Request_ReleaseTabId = {
	tabId: string
}
export type ApiStruct_FocusedObject = {
	_v1: {
		updateFocusObject: BodyApi<void, Request_UpdateFocusObject>,
		releaseObject: BodyApi<void, Request_ReleaseObject>,
		unfocusByTabId: BodyApi<void, Request_UnfocusTabId>,
		releaseByTabId: BodyApi<void, Request_ReleaseTabId>,
	}
}

export const ApiDef_FocusedObject: ApiDefResolver<ApiStruct_FocusedObject> = {
	_v1: {
		updateFocusObject: {method: HttpMethod.POST, path: '/v1/focus-object/focus'},
		releaseObject: {method: HttpMethod.POST, path: '/v1/focus-object/release'},
		unfocusByTabId: {method: HttpMethod.POST, path: '/v1/focus-object/unfocus'},
		releaseByTabId: {method: HttpMethod.POST, path: '/v1/focus-object/release-tab'},
	}
};
