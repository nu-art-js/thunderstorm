import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '../types';
import {Minute} from '@nu-art/ts-common';


export type Request_ActionToProcess = { key: string, data?: any };
export type ActionMetaData = { key: string, description: string, group: string };
export type ApiStruct_ActionProcessing = {
	vv1: {
		execute: BodyApi<void, Request_ActionToProcess>
		list: QueryApi<ActionMetaData[]>
	}
}

export const ApiDef_ActionProcessing: ApiDefResolver<ApiStruct_ActionProcessing> = {
	vv1: {
		execute: {method: HttpMethod.POST, path: 'v1/action-processor/execute', timeout: 5 * Minute},
		list: {method: HttpMethod.GET, path: 'v1/action-processor/list'},
	}
};