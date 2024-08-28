import {ApiDef_topic, ApiStruct_topic, DBDef_Topic, DBProto_Topic, UI_Topic} from '../shared';
import {DispatcherDef, ThunderDispatcherV3} from '@thunder-storm/core/frontend/core/db-api-gen/types';
import {apiWithBody, apiWithQuery, ModuleFE_BaseApi} from '@thunder-storm/core/frontend';
import {ApiDefCaller} from '@thunder-storm/core';


export type DispatcherType_Topic = DispatcherDef<DBProto_Topic, `__onTopicsUpdated`>;

export const dispatch_onTopicsUpdated = new ThunderDispatcherV3<DispatcherType_Topic>('__onTopicsUpdated');

export class ModuleFE_topic_Class
	extends ModuleFE_BaseApi<DBProto_Topic>
	implements ApiDefCaller<ApiStruct_topic> {

	_v1: ApiDefCaller<ApiStruct_topic>['_v1'];

	constructor() {
		super(DBDef_Topic, dispatch_onTopicsUpdated);
		this._v1 = {
			'?': apiWithBody(ApiDef_topic._v1['?']),
			'??': apiWithQuery(ApiDef_topic._v1['??']),
		};
	}

	public getTopics(collectionName: string, refId: string): UI_Topic[] {
		return this.cache.filter(topic => topic.type === collectionName && topic.refId === refId);
	}

}

export const ModuleFE_Topic = new ModuleFE_topic_Class();

