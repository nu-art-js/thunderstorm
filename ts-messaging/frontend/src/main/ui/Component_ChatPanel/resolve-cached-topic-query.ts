export type CachedTopicQueryPlan =
	| {skipQuery: true; hasMore: true; nextCursor: string}
	| {skipQuery: true}
	| {skipQuery: false};

export function resolveCachedTopicQuery(
	cached: ReadonlyArray<{__created?: number}>,
	nextCursor?: string,
): CachedTopicQueryPlan {
	if (nextCursor || cached.length === 0)
		return {skipQuery: false};

	const oldestCreated = cached[0]?.__created;
	if (oldestCreated != null)
		return {skipQuery: true, hasMore: true, nextCursor: String(oldestCreated)};

	return {skipQuery: true};
}
