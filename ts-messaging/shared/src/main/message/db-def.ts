import {Database} from '@nu-art/db-api-shared';
import {
	exists,
	InvalidResult,
	tsValidateUniqueId,
} from '@nu-art/ts-common';
import {DatabaseDef_Message, DB_Message} from './types.js';
import {MessagingDBGroup} from '../consts.js';

const Validator_GeneratedProps_Message: DatabaseDef_Message['generatedPropsValidator'] = {
	_auditorId: tsValidateUniqueId,
};

const Validator_ModifiableProps_Message = (instance?: DB_Message): InvalidResult<DB_Message> => {
	if (!exists(instance))
		return 'No object received';

	if (!exists(instance.topicId))
		return 'topicId is required';

	const hasText = exists(instance.text) && instance.text.length > 0;
	const hasAttachments = exists(instance.attachments) && instance.attachments.length > 0;
	if (!hasText && !hasAttachments)
		return 'Message must have text or attachments (at least one)';

	return undefined;
};

export const DBDef_Message: Database<DatabaseDef_Message> = {
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
