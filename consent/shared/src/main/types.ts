/*
 * @nu-art/consent-shared - Generic consent categories, stored choice and subscriptions
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/** Built-in categories. Apps add their own keys (e.g. `'video-embeds'`). */
export const ConsentCategory_Necessary = 'necessary';
export const ConsentCategory_Functional = 'functional';
export const ConsentCategory_Analytics = 'analytics';
export const ConsentCategory_Marketing = 'marketing';

export type ConsentCategoryKey = string;

export type ConsentCategoryDef = {
	key: ConsentCategoryKey;
	/** Always granted and not shown as a choice (strictly necessary storage, the consent record itself). */
	required?: boolean;
};

/** Default categories: necessary (required), functional, analytics, marketing. */
export const DefaultConsentCategories: ConsentCategoryDef[] = [
	{key: ConsentCategory_Necessary, required: true},
	{key: ConsentCategory_Functional},
	{key: ConsentCategory_Analytics},
	{key: ConsentCategory_Marketing},
];

/** The stored choice. Unknown categories are treated as not granted. */
export type ConsentChoice = {
	/** Policy version the choice was made under; a newer version asks again. */
	policyVersion: number;
	/** Epoch ms of the decision. */
	decidedAt: number;
	granted: Record<ConsentCategoryKey, boolean>;
};

/**
 * The read side of consent. Libraries that must respect consent (analytics, embeds) depend on this
 * interface only; the app passes them its consent module.
 */
export type ConsentSource = {
	/** True only after an explicit grant; false before any decision. */
	isGranted(category: ConsentCategoryKey): boolean;
	/** Calls `listener(granted)` on every change of `category`. Returns an unsubscribe function. */
	subscribe(category: ConsentCategoryKey, listener: (granted: boolean) => void): () => void;
};
