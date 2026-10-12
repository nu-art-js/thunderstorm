/** Floor so a failed embed still shows its error instead of collapsing. */
export const EmbedFrameMinPx = 120;
/** Ceiling: a document that reports its own viewport cannot grow past this. */
export const EmbedFrameMaxPx = 2000;
/** Ignore jitter below this so a post cannot feed the next measurement. */
export const EmbedResizeDeltaPx = 2;
/** Added once to the measured content so the edge is not clipped. */
export const EmbedResizeFudgePx = 8;

/** Inside the frame: the height to post for a content measurement, or null to stay. */
export const nextEmbedFrameHeight = (contentHeight: number, previousPosted: number | null): number | null => {
	if (!Number.isFinite(contentHeight) || contentHeight < 0)
		return null;

	const next = Math.min(EmbedFrameMaxPx, Math.ceil(contentHeight) + EmbedResizeFudgePx);
	if (previousPosted !== null && Math.abs(next - previousPosted) < EmbedResizeDeltaPx)
		return null;

	return next;
};

/** In the parent: the height to apply for a reported height, clamped, or null to stay. */
export const applyEmbedFrameHeight = (reported: number, current: number | null): number | null => {
	if (!Number.isFinite(reported) || reported < 0)
		return null;

	const next = Math.min(EmbedFrameMaxPx, Math.max(EmbedFrameMinPx, Math.ceil(reported)));
	if (current !== null && Math.abs(next - current) < EmbedResizeDeltaPx)
		return null;

	return next;
};
