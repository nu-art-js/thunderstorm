/*
 * @nu-art/seo-shared - Site and page SEO config and share-meta rendering
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {I18N_Brand, I18N_Params} from '@nu-art/i18n-shared';
import type {I18nLocaleCode} from '@nu-art/i18n-shared';

/** Resolves a key through the single i18n resolution path, for one locale. */
export type SeoTranslate = (id: I18N_Brand, params?: I18N_Params) => string;

/** Default Open Graph / Twitter share image. Page images may differ. */
export const SeoShareImageSize = {width: 1200, height: 630} as const;

export const SeoImageTypes = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type SeoImageType = typeof SeoImageTypes[number];

export const SeoColorSchemes = ['light', 'dark', 'light dark'] as const;
export type SeoColorScheme = typeof SeoColorSchemes[number];

export const SeoOgTypes = ['website', 'article', 'profile'] as const;
export type SeoOgType = typeof SeoOgTypes[number];

/** Share image. `alt` is an i18n key. `src` is an app path or an absolute http(s) URL. */
export type SeoImage = {
	src: string;
	type: SeoImageType;
	width: number;
	height: number;
	alt: I18N_Brand;
};

/** Icon file. `src` is an app path or an absolute URL. `sizes` is like `32x32` or `any`. */
export type SeoIcon = {
	src: string;
	type: string;
	sizes: string;
};

export type SeoIconSet = {
	favicon: SeoIcon;
	appleTouch: SeoIcon;
	/** Icons listed in site.webmanifest. At least one. */
	manifest: readonly SeoIcon[];
};

/** schema.org Organization. `name` is an i18n key. `url` defaults to the site origin. */
export type SeoPublisher = {
	name: I18N_Brand;
	url?: string;
	logo?: SeoImage;
	sameAs?: readonly string[];
};

/** Twitter card. `site` is an `@handle`, not prose. */
export type SeoTwitterCard = {
	card: 'summary_large_image';
	site?: string;
};

export type SeoBundle = {
	scripts: readonly string[];
	styles: readonly string[];
};

export type LlmsTxtLink =
	/** A registered page, in the same locale; its title is the page title. */
	| {page: string; description?: I18N_Brand}
	| {url: string; title: I18N_Brand; description?: I18N_Brand};

/** llms.txt (llmstxt.org): section order and links in code, prose from i18n. */
export type LlmsTxtDef = {
	title: I18N_Brand;
	summary: I18N_Brand;
	details?: readonly I18N_Brand[];
	sections: readonly {title: I18N_Brand; links: readonly LlmsTxtLink[]}[];
};

/**
 * One site. Human text is i18n keys. `enabledLocales` is a subset of the i18n locale enum.
 * `origins` is the public origin per env key (`local`, `dev`, `prod`), with no path.
 */
export type SeoSiteDef = {
	key: string;
	siteName: I18N_Brand;
	origins: Readonly<Record<string, string>>;
	publisher: SeoPublisher;
	/** Default share image. Must be 1200×630. */
	image: SeoImage;
	themeColor: string;
	colorScheme: SeoColorScheme;
	icons: SeoIconSet;
	twitter: SeoTwitterCard;
	enabledLocales: readonly I18nLocaleCode[];
	defaultLocale: I18nLocaleCode;
	llms?: LlmsTxtDef;
};

/** JSON-LD node. Field names and structure in code; every human string comes from `t`. */
export type JsonLdNode = {'@context'?: string; '@type': string | string[]; [field: string]: unknown};

export type SeoRenderContext = {
	t: SeoTranslate;
	locale: I18nLocaleCode;
	/** Absolute canonical URL of this page in this locale. */
	url: string;
	origin: string;
	site: SeoSiteDef;
	page: SeoPageDef;
};

/** Typed JSON-LD builder. One node; the shell adds `@context`. */
export type SeoJsonLdBuilder = (context: SeoRenderContext) => JsonLdNode;

/**
 * One public route. `path` is locale-less (`/`, `/pricing`) and is served as `/<locale><path>`.
 * `noindex` emits `noindex,nofollow` and drops the route from the sitemap.
 * `sitemap: false` omits an indexable route from the sitemap only.
 */
export type SeoPageDef = {
	key: string;
	path: string;
	title: I18N_Brand;
	description: I18N_Brand;
	ogType?: SeoOgType;
	image?: SeoImage;
	noindex?: boolean;
	sitemap?: boolean;
	jsonLd?: readonly SeoJsonLdBuilder[];
	/** Crawler-visible copy. The SPA may replace the mounts. */
	sections?: readonly {heading?: I18N_Brand; body: I18N_Brand}[];
	/** `<div data-ts-embed="<key>">` placeholders. */
	mounts?: readonly string[];
};
