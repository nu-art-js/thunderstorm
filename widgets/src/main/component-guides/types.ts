import * as React from 'react';

/** Runnable reference for one widget — how-to doc + named examples. */
export type WidgetComponentGuide = {
	/** Stable id — matches design-language gallery component id when tokenized. */
	id: string;
	title: string;
	/** Path relative to `widgets/src/main/` where agents read the markdown how-to. */
	howToPath: string;
	/** Named examples (object tree, typed catalog, …). */
	examples: Record<string, React.FC>;
	/** Default when a consumer renders a single example. */
	primaryExample: React.FC;
};
