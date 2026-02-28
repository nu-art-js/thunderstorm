import {
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
import {Database} from '@nu-art/db-api-shared';
import {
	BaseMessage,
	DB_Message,
	DB_Message_Image,
	DB_Message_Text,
	DB_Message_Video,
	DatabaseDef_Message,
	MessageType_Image,
	MessageType_Text,
	MessageType_Video,
	UI_Message
} from './types.js';
import {MessagingDBGroup} from '../consts.js';

export const MessageTools = {
	isText: (instance: UI_Message): instance is DB_Message_Text => instance.type === 'text',
	isImage: (instance: UI_Message): instance is DB_Message_Image => instance.type === 'image',
	isVideo: (instance: UI_Message): instance is DB_Message_Video => instance.type === 'video',
};

const Validator_GeneratedProps_Message: DatabaseDef_Message['generatedPropsValidator'] = {
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
			return `Could not find message type('${(instance as DB_Message)?.type}') when attempting to validate a message!`;
	}
};

export const DBDef_message: Database<DatabaseDef_Message> = {
	dbKey: 'messages',
	entityName: 'Message',
	modifiablePropsValidator: Validator_ModifiableProps_Message as DatabaseDef_Message['modifiablePropsValidator'],
	generatedPropsValidator: Validator_GeneratedProps_Message,
	generatedProps: ['_auditorId'],
	versions: ['1.0.0'],
	uniqueKeys: ['_id'],
	frontend: {
		group: MessagingDBGroup,
		name: 'message',
	},
	backend: {
		name: 'messages',
	},
};
