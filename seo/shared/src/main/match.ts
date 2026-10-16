/*
 * @nu-art/seo-shared - Site and page SEO config and share-meta rendering
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BadImplementationException} from '@nu-art/ts-common';
import {normalizeOrigin, siteOrigin} from './locale-url.js';
import type {SeoPageDef, SeoSiteDef, SeoSitemapEntry} from './types.js';

const ConcretePath = /^\/(?:[A-Za-z0-9._~%-]+(?:\/[A-Za-z0-9._~%-]+)*)?\/?(?:\?[A-Za-z0-9._~%=&-]*)?$/;

export const seoPathSegments = (path: string): string[] => path.split('/').filter(Boolean);

/** A pattern and a concrete path of the same shape, with `:params` filled. */
export const fillSeoPath = (pattern: string, pathParams: Readonly<Record<string, string>>): string => {
	if (!pattern.includes(':'))
		return pattern;

	return pattern.replace(/:([a-z][a-z0-9]*)/g, (_match, name: string) => {
		const value = pathParams[name];
		if (!value)
			throw new BadImplementationException(`Missing SEO path param '${name}'`);

		return encodeURIComponent(value);
	});
};

export const isConcreteSeoPath = (path: string): boolean => path === '/' || (ConcretePath.test(path) && !path.includes('..') && !path.includes('//'));

/** Two patterns can describe the same URL when they have the same length and no segment disagrees. */
export const seoPathsOverlap = (left: string, right: string): boolean => {
	const a = seoPathSegments(left);
	const b = seoPathSegments(right);
	if (a.length !== b.length)
		return false;

	return a.every((part, index) => part.startsWith(':') || b[index].startsWith(':') || part === b[index]);
};

export type SeoPathMatch = {page: SeoPageDef; pathParams: Record<string, string>};

/** The page whose pattern matches `path`. More static segments win. */
export const matchSeoPage = (pages: readonly SeoPageDef[], path: string): SeoPathMatch | undefined => {
	const concrete = seoPathSegments(path);
	let best: {page: SeoPageDef; pathParams: Record<string, string>; score: number} | undefined;
	for (const page of pages) {
		const pattern = seoPathSegments(page.path);
		if (pattern.length !== concrete.length)
			continue;

		const pathParams: Record<string, string> = {};
		let score = 0;
		let matches = true;
		for (let index = 0; index < pattern.length; index++) {
			const expected = pattern[index];
			if (expected.startsWith(':')) {
				pathParams[expected.slice(1)] = concrete[index];
				continue;
			}

			if (expected !== concrete[index]) {
				matches = false;
				break;
			}

			score++;
		}

		if (!matches)
			continue;

		if (best && best.score === score)
			throw new BadImplementationException(`SEO path '${path}' matches '${best.page.key}' and '${page.key}'`);

		if (!best || score > best.score)
			best = {page, pathParams, score};
	}

	return best ? {page: best.page, pathParams: best.pathParams} : undefined;
};

const entryPath = (page: SeoPageDef, entry: SeoSitemapEntry): string => {
	const path = entry.path ?? fillSeoPath(page.path, entry.pathParams ?? {});
	if (!isConcreteSeoPath(path))
		throw new BadImplementationException(`SEO page '${page.key}' sitemap path '${path}' is not a concrete path`);

	return path;
};

/** Concrete locale-less paths for the sitemap. Patterns without `sitemapEntries` are skipped. */
export const collectSitemapPaths = async (pages: readonly SeoPageDef[]): Promise<string[]> => {
	const paths: string[] = [];
	for (const page of pages) {
		if (page.noindex || page.sitemap === false)
			continue;

		if (page.sitemapEntries) {
			for (const entry of await page.sitemapEntries())
				paths.push(entryPath(page, entry));

			continue;
		}

		if (page.path.includes(':'))
			continue;

		paths.push(page.path);
	}

	return paths;
};

export const hostMatches = (pattern: string, host: string): boolean => {
	if (!pattern.startsWith('*.'))
		return pattern === host;

	const suffix = pattern.slice(1);
	return host.endsWith(suffix) && host.split('.').length === pattern.split('.').length;
};

/**
 * The site that answers `host`. An exact host beats a wildcard.
 * A single site with no `hosts` answers every host (one app behind a rewrite).
 */
export const selectSeoSite = (sites: readonly SeoSiteDef[], host: string): SeoSiteDef | undefined => {
	const name = host.toLowerCase();
	const exact = sites.filter(site => site.hosts?.some(pattern => !pattern.startsWith('*.') && pattern === name));
	if (exact.length > 1)
		throw new BadImplementationException(`More than one SEO site matches host '${name}'`);

	if (exact.length === 1)
		return exact[0];

	const wild = sites.filter(site => site.hosts?.some(pattern => pattern.startsWith('*.') && hostMatches(pattern, name)));
	if (wild.length > 1)
		throw new BadImplementationException(`More than one SEO site matches host '${name}'`);

	if (wild.length === 1)
		return wild[0];

	if (sites.length === 1 && !(sites[0].hosts?.length))
		return sites[0];

	return undefined;
};

const headerValue = (value: string | string[] | undefined): string | undefined => {
	const raw = Array.isArray(value) ? value[0] : value;
	const first = raw?.split(',')[0]?.trim().toLowerCase();
	return first ? first.replace(/:\d+$/, '') : undefined;
};

/**
 * Public host of a request. Firebase Hosting and Fastly keep the visitor host on
 * `x-fh-requested-host` / `x-forwarded-host` when the rewrite target is Cloud Run.
 */
export const requestHostFromHeaders = (headers: {
	host?: string | string[];
	'x-forwarded-host'?: string | string[];
	'x-fh-requested-host'?: string | string[];
}): string => headerValue(headers['x-fh-requested-host']) ?? headerValue(headers['x-forwarded-host']) ?? headerValue(headers.host) ?? '';

/**
 * Canonical origin. A wildcard host (a tenant, `acme.beamz.dev`) keeps the env origin's
 * scheme and port and replaces the hostname. Every other request uses `origins[env]`.
 */
export const resolveSiteOrigin = (site: SeoSiteDef, env: string, requestHost: string): string => {
	const origin = siteOrigin(site.origins, env, site.key);
	const host = requestHost.toLowerCase();
	const wildcard = site.hosts?.some(pattern => pattern.startsWith('*.') && hostMatches(pattern, host));
	if (!wildcard)
		return origin;

	const url = new URL(normalizeOrigin(origin));
	if (host === url.hostname || host.endsWith(`.${url.hostname}`)) {
		url.hostname = host;
		return url.origin;
	}

	return `https://${host}`;
};

/** `/en-us/book/ada` → locale segment `en-us` and page path `/book/ada`. */
export const splitLocalizedRequest = (urlPath: string): {locale: string; pagePath: string} | undefined => {
	const parts = urlPath.split('?')[0].split('/').filter(Boolean);
	if (!parts.length)
		return undefined;

	const rest = parts.slice(1);
	return {locale: parts[0], pagePath: rest.length ? `/${rest.join('/')}` : '/'};
};
