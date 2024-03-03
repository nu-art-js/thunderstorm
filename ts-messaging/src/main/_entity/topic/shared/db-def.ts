import {DBDef_V3, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {DBProto_Topic} from './types';
import {MessagingDBGroup} from '../../shared';

const Validator_ModifiableProps: DBProto_Topic['modifiablePropsValidator'] = {};

export const Validator_GeneratedProps_Topic = {
	type: tsValidateString(),
	refId: tsValidateUniqueId,
};

export const DBDef_Topic: DBDef_V3<DBProto_Topic> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps_Topic,
	versions: ['1.0.0'],
	dbKey: 'topics',
	entityName: 'Topic',
	frontend: {
		group: MessagingDBGroup,
		name: 'topic',
	},
	backend: {
		name: 'topics',
	}
};