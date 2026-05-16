import {DBDef_Message} from '../../main/message/db-def.js';
import type {DB_Message} from '../../main/message/types.js';

// Cast the validator to accept any input for edge-case testing (empty, missing fields, etc.)
const validateModifiable = (input: Partial<DB_Message> | undefined): boolean => {
	const validator = DBDef_Message.modifiablePropsValidator as (instance?: Partial<DB_Message>) => string | undefined;
	const result = validator(input);
	return !result;
};

describe('DBDef_Message — modifiable props validator', () => {
	it('Accepts message with text only', () => {
		const valid = validateModifiable({topicId: 'topic-123', text: 'Hello world'});
		if (!valid)
			throw new Error('Expected valid message with text to pass');
	});

	it('Accepts message with attachments only', () => {
		const valid = validateModifiable({topicId: 'topic-123', attachments: [{assetId: 'asset-1'}]});
		if (!valid)
			throw new Error('Expected valid message with attachments to pass');
	});

	it('Accepts message with both text and attachments', () => {
		const valid = validateModifiable({topicId: 'topic-123', text: 'See attached', attachments: [{assetId: 'asset-1'}]});
		if (!valid)
			throw new Error('Expected valid message with text and attachments to pass');
	});

	it('Rejects message with neither text nor attachments', () => {
		const valid = validateModifiable({topicId: 'topic-123'});
		if (valid)
			throw new Error('Expected message without text or attachments to fail');
	});

	it('Rejects message with empty text and no attachments', () => {
		const valid = validateModifiable({topicId: 'topic-123', text: ''});
		if (valid)
			throw new Error('Expected message with empty text and no attachments to fail');
	});

	it('Rejects message with empty attachments array and no text', () => {
		const valid = validateModifiable({topicId: 'topic-123', attachments: []});
		if (valid)
			throw new Error('Expected message with empty attachments and no text to fail');
	});

	it('Rejects message without topicId', () => {
		const valid = validateModifiable({text: 'Hello'});
		if (valid)
			throw new Error('Expected message without topicId to fail');
	});

	it('Rejects undefined input', () => {
		const valid = validateModifiable(undefined);
		if (valid)
			throw new Error('Expected undefined input to fail');
	});
});

describe('DBDef_Message — structure', () => {
	it('Has correct dbKey', () => {
		if (DBDef_Message.dbKey !== 'messages')
			throw new Error(`Expected dbKey "messages", got "${DBDef_Message.dbKey}"`);
	});

	it('Has version 1.0.0', () => {
		if (!DBDef_Message.versions.includes('1.0.0'))
			throw new Error(`Expected versions to include "1.0.0", got ${JSON.stringify(DBDef_Message.versions)}`);
	});

	it('Has _auditorId in generatedProps', () => {
		const genProps = DBDef_Message.generatedProps as string[];
		if (!genProps.includes('_auditorId'))
			throw new Error('Missing generatedProp: _auditorId');
	});

	it('Has correct entityName', () => {
		if (DBDef_Message.entityName !== 'Message')
			throw new Error(`Expected entityName "Message", got "${DBDef_Message.entityName}"`);
	});
});
