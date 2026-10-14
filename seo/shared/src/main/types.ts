import type {I18N_Brand, I18N_Params} from '@nu-art/i18n-shared';

/** Resolves a key through the single i18n resolution path, for one locale. */
export type SeoTranslate = (id: I18N_Brand, params?: I18N_Params) => string;

export type SeoRenderContext = {
	t: SeoTranslate;
	/** Locale code (`nl`, `en_US`). */
	locale: string;
	/** Absolute canonical URL of this page in this locale. */
	url: string;
	baseUrl: string;
};

/** JSON-LD: field names and structure in code, every human text from `t`. */
export type JsonLdNode = { '@context'?: string; '@type': string | string[]; [field: string]: unknown };

/** A server-rendered page. Structure only: every text is an i18n key. */
export type SeoPageDef = {
	key: string;
	/** Locale-less path (`/`, `/pricing`). Served as `/<locale><path>`. */
	path: string;
	title: I18N_Brand;
	description: I18N_Brand;
	/** Absolute URL or app path of the Open Graph image. */
	ogImage?: string;
	ogType?: string;
	noindex?: boolean;
	jsonLd?: (context: SeoRenderContext) => JsonLdNode | JsonLdNode[];
	/** Main text rendered as semantic HTML (crawlers and no-JS readers see it). */
	sections?: { heading?: I18N_Brand; body: I18N_Brand }[];
	/** Placeholders the frontend bundle mounts components into (`<div data-ts-embed="<key>">`). */
	mounts?: string[];
};

/** Frontend assets every shell loads (one bundle from Hosting). */
export type SeoBundle = {
	scripts: string[];
	styles: string[];
};

export type LlmsTxtLink =
	/** A registered page, in the same locale; its title is the page title. */
	| { page: string; description?: I18N_Brand }
	| { url: string; title: I18N_Brand; description?: I18N_Brand };

/** llms.txt (llmstxt.org): section order and links in code, prose from i18n. */
export type LlmsTxtDef = {
	title: I18N_Brand;
	summary: I18N_Brand;
	details?: I18N_Brand[];
	sections: { title: I18N_Brand; links: LlmsTxtLink[] }[];
};
