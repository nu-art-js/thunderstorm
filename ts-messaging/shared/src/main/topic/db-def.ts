import {Database} from '@nu-art/db-api-shared';
import {tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {DatabaseDef_Topic} from './types.js';
import {MessagingDBGroup} from '../consts.js';

const Validator_ModifiableProps: DatabaseDef_Topic['modifiablePropsValidator'] = {
	anchor: {
		dbKey: tsValidateString(),
		id: tsValidateUniqueId,
	},
};

export const DBDef_Topic: Database<DatabaseDef_Topic> = {
	dbKey: 'topics',
	entityName: 'Topic',
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: {},
	versions: ['1.0.0'],
	uniqueKeys: ['anchor.dbKey', 'anchor.id'],
	frontend: {
		group: MessagingDBGroup,
		name: 'topic',
	},
	backend: {
		name: 'topics',
	},
};
