import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '../types';


export type Request_ActionToProcess = { key: string, data?: any };
export type ApiStruct_ActionProcessing = {
	vv1: {
		execute: BodyApi<void, Request_ActionToProcess>
		list: QueryApi<{ items: string[] }>
	}
}

export const ApiDef_ActionProcessing: ApiDefResolver<ApiStruct_ActionProcessing> = {
	vv1: {
		execute: {method: HttpMethod.POST, path: 'v1/action-processor/execute'},
		list: {method: HttpMethod.GET, path: 'v1/action-processor/list'},
	}
};