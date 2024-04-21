import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';
import {Focused, FocusEvent} from './types';
import {TypedMap, UniqueId} from '@nu-art/ts-common';

export type Request_UpdateFocusObject = {
	focusData: Focused[]
	event: FocusEvent
}
export type Request_SetFocusStatus = {
	event: FocusEvent
}
export type Request_ReleaseObject = {
	objectsToRelease: Focused[]
}
export type Request_ReleaseTabId = {}

export type FocusedItem_Update = {
	request: {
		currentlyFocused: TypedMap<UniqueId[]>;
	};
	response: void;
}

export type ApiStruct_FocusedObject = {
	_v1: {
		setFocusStatusByTabId: BodyApi<void, Request_SetFocusStatus>,
		updateFocusData: BodyApi<void, Request_UpdateFocusObject>,
		releaseObject: BodyApi<void, Request_ReleaseObject>,
		releaseByTabId: BodyApi<void, Request_ReleaseTabId>,
		update: BodyApi<FocusedItem_Update['response'], FocusedItem_Update['request']>
	}
}

export const ApiDef_FocusedObject: ApiDefResolver<ApiStruct_FocusedObject> = {
	_v1: {
		setFocusStatusByTabId: {method: HttpMethod.POST, path: '/v1/focus-object/set-focus-status'},
		updateFocusData: {method: HttpMethod.POST, path: '/v1/focus-object/focus'},
		releaseObject: {method: HttpMethod.POST, path: '/v1/focus-object/release'},
		releaseByTabId: {method: HttpMethod.POST, path: '/v1/focus-object/release-tab'}, // Tab Id is sent as header, so we know what tab to release.
		update: {method: HttpMethod.POST, path: '/v1/focus-object/update'},
	}
};
