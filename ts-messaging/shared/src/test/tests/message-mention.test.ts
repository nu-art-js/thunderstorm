import {formatMessageMentionToken, parseMessageMentionIds} from '../../main/message-mention.js';

describe('parseMessageMentionIds', () => {
	it('returns empty for omitted or plain text', () => {
		if (parseMessageMentionIds(undefined).length !== 0)
			throw new Error('Expected omitted text to parse as no mentions');
		if (parseMessageMentionIds('hello @permissions').length !== 0)
			throw new Error('Expected @name leftover to parse as no mentions');
	});

	it('extracts unique @_id tokens in order', () => {
		const a = '0123456789abcdef0123456789abcdef';
		const b = 'fedcba9876543210fedcba9876543210';
		const text = `ask ${formatMessageMentionToken(a)} and ${formatMessageMentionToken(b)} and ${formatMessageMentionToken(a)}`;
		const parsed = parseMessageMentionIds(text);
		if (parsed.length !== 2 || parsed[0] !== a || parsed[1] !== b)
			throw new Error(`Expected unique ordered ids, got ${JSON.stringify(parsed)}`);
	});

	it('ignores uppercase or short forged tokens', () => {
		const parsed = parseMessageMentionIds('@_id(0123456789ABCDEF0123456789ABCDEF) @_id(not-an-id) @_id(abc)');
		if (parsed.length !== 0)
			throw new Error(`Expected fail-closed parse, got ${JSON.stringify(parsed)}`);
	});
});
