/**
 * Claims of a signed embed token. `subject` is whatever the app embeds (a page, a widget, an account);
 * the library gives it no meaning. `ver` lets the app revoke every token of a subject by bumping it.
 */
export type EmbedTokenClaims = {
	purpose: 'embed';
	subject: string;
	/** Exact origins (`https://example.com`) allowed to frame this embed when the token was issued. */
	origins: string[];
	ver: number;
	jti: string;
	iat: number;
	exp: number;
};

/** What the app currently allows for a subject. A token only works within this. */
export type EmbedSubjectState = {
	origins: readonly string[];
	version: number;
};

/** Message a framed embed posts to its parent so the loader can size the iframe. */
export type EmbedResizeMessage = {
	source: typeof EmbedMessageSource;
	type: 'resize';
	height: number;
};

export const EmbedMessageSource = 'ts-embed';
