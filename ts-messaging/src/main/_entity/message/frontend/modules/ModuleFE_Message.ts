import {apiWithBody, apiWithQuery, ModuleFE_BaseApi} from '@thunder-storm/core/frontend';
import {ApiDefCaller} from '@thunder-storm/core';
import {DispatcherDef, ThunderDispatcherV3} from '@thunder-storm/core/frontend/core/db-api-gen/types';
import {ApiDef_message, ApiStruct_message, DBDef_message, DBProto_Message, MessageType_Text} from '../shared';


export type DispatcherType_Message = DispatcherDef<DBProto_Message, `__onMessagesUpdated`>;

export const dispatch_onMessagesUpdated = new ThunderDispatcherV3<DispatcherType_Message>('__onMessagesUpdated');

export class ModuleFE_Message_Class
	extends ModuleFE_BaseApi<DBProto_Message>
	implements ApiDefCaller<ApiStruct_message> {

	_v1: ApiDefCaller<ApiStruct_message>['_v1'];

	constructor() {
		super(DBDef_message, dispatch_onMessagesUpdated);
		this._v1 = {
			'?': apiWithBody(ApiDef_message._v1['?']),
			'??': apiWithQuery(ApiDef_message._v1['??']),
		};
	}

	async createMessage(topicId: string, msg: string) {
		const newMessage = {type: MessageType_Text, topicId, text: msg};
		await this.v1.upsert(newMessage as DBProto_Message['preDbType']).executeSync();
	}

}

export const ModuleFE_Message = new ModuleFE_Message_Class();

