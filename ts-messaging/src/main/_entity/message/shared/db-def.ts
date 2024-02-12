import {
	DBDef_V3,
	deleteKeysObject,
	exists,
	InvalidResult,
	removeDBObjectKeys,
	tsValidate,
	tsValidateString,
	tsValidateUniqueId,
	tsValidateValue,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {
	BaseMessage,
	DB_Message,
	DB_Message_Image,
	DB_Message_Text,
	DB_Message_Video,
	DBProto_Message,
	MessageType_Image,
	MessageType_Text,
	MessageType_Video,
	UI_Message
} from './types';

export const MessageTools = {
	isText: (instance: UI_Message): instance is DB_Message_Text => {
		return instance.type === 'text';
	},
	isImage: (instance: UI_Message): instance is DB_Message_Image => {
		return instance.type === 'image';
	},
	isVideo: (instance: UI_Message): instance is DB_Message_Video => {
		return instance.type === 'video';
	}
};

const Validator_GeneratedProps_Text: DBProto_Message['generatedPropsValidator'] = {
	_auditorId: tsValidateUniqueId,
};

const Validator_BaseMessage: ValidatorTypeResolver<BaseMessage> = {
	topicId: tsValidateUniqueId,
};

const Validator_DB_Message_Image: ValidatorTypeResolver<DB_Message_Image> = {
	...Validator_BaseMessage,
	type: tsValidateValue([MessageType_Image]),
	url: tsValidateString(),
};

const Validator_DB_Message_Video: ValidatorTypeResolver<DB_Message_Video> = {
	...Validator_BaseMessage,
	type: tsValidateValue([MessageType_Video]),
};

const Validator_DB_Message_Text: ValidatorTypeResolver<DB_Message_Text> = {
	...Validator_BaseMessage,
	type: tsValidateValue([MessageType_Text]),
	text: tsValidateString(),
};

const Validator_ModifiableProps_Message = (instance?: DB_Message): InvalidResult<DB_Message> => {
	if (!exists(instance))
		return 'No object received';

	const __toValidate = deleteKeysObject(removeDBObjectKeys(instance), ['_auditorId']);

	switch (instance?.type) {
		case MessageType_Text:
			return tsValidate(__toValidate, Validator_DB_Message_Text);
		case MessageType_Image:
			return tsValidate(__toValidate, Validator_DB_Message_Image);
		case MessageType_Video:
			return tsValidate(__toValidate, Validator_DB_Message_Video);
		default:
			// @ts-ignore
			return `Could not find message type('${instance.type}') when attempting to validate a message!`;
	}
};


export const DBDef_message: DBDef_V3<DBProto_Message> = {
	modifiablePropsValidator: Validator_ModifiableProps_Message as DBProto_Message['modifiablePropsValidator'],
	generatedPropsValidator: Validator_GeneratedProps_Text,
	versions: ['1.0.0'],
	dbName: 'messages',
	entityName: 'Message',
};