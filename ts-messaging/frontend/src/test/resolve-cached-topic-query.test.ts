import {resolveCachedTopicQuery} from '../main/ui/Component_ChatPanel/resolve-cached-topic-query.js';

describe('resolveCachedTopicQuery', () => {
	it('skips the initial query and seeds Load older from the oldest cached __created', () => {
		const plan = resolveCachedTopicQuery([{__created: 100}, {__created: 200}]);
		if (plan.skipQuery !== true)
			throw new Error(`Expected skipQuery true, got ${JSON.stringify(plan)}`);
		if (!('nextCursor' in plan) || plan.nextCursor !== '100' || plan.hasMore !== true)
			throw new Error(`Expected hasMore + cursor 100, got ${JSON.stringify(plan)}`);
	});

	it('fetches when Load older already has a cursor', () => {
		const plan = resolveCachedTopicQuery([{__created: 100}], '100');
		if (plan.skipQuery !== false)
			throw new Error(`Expected fetch on load-more, got ${JSON.stringify(plan)}`);
	});

	it('fetches when the topic cache is empty', () => {
		const plan = resolveCachedTopicQuery([]);
		if (plan.skipQuery !== false)
			throw new Error(`Expected fetch on empty cache, got ${JSON.stringify(plan)}`);
	});

	it('skips without a cursor when cached rows have no __created', () => {
		const plan = resolveCachedTopicQuery([{}]);
		if (plan.skipQuery !== true || 'nextCursor' in plan)
			throw new Error(`Expected skip without cursor, got ${JSON.stringify(plan)}`);
	});
});
