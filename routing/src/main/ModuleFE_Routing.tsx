import {useEffect} from 'react';
import {BrowserRouter, Navigate, NavLink, NavLinkProps, Route, Routes} from 'react-router-dom';
import {TS_Route} from './types.js';
import {UrlQueryParams} from '@nu-art/api-types';
import {
	_keys,
	BadImplementationException,
	composeQueryParams,
	composeUrl,
	exists,
	Module,
	RouteParams
} from '@nu-art/ts-common';
import {mouseEventHandler, stopPropagation, ThunderDispatcher} from '@nu-art/thunder-core';


export interface OnLocationChanged {
	__onLocationChanged: (path: string) => void;
}

export const dispatch_onLocationChanged = new ThunderDispatcher<OnLocationChanged, '__onLocationChanged'>('__onLocationChanged');


class ModuleFE_Routing_Class
	extends Module<{}> {

	// ######################## Inner Data ########################

	private routesMapByKey: {
		[key: string]: {
			route: TS_Route,
			fullPath: string
		}
	} = {};
	private routesMapByPath: {
		[fullPath: string]: TS_Route
	} = {};
	private RoutesRenderer: (() => JSX.Element) | null = null;

	constructor() {
		super();
		// Listen to browser navigation events (back/forward buttons, etc.)
		window.addEventListener('popstate', () => {
			dispatch_onLocationChanged.dispatchUI(window.location.pathname);
		});
	}

	// ######################## Public Functions ########################

	goToRoute<P extends RouteParams>(route: TS_Route<P>, params?: Partial<P>, hash?: string) {
		const fullPath = this.getFullPath(route.key);
		this.logDebug(`[routing] goToRoute: key='${route.key}' resolved fullPath='${fullPath}'`);
		try {
			const queryString = composeQueryParams(params);
			const search = queryString.length > 0 ? `?${queryString}` : '';
			const url = composeUrl(fullPath, params, hash);

			if (url === window.location.href)
				return this.logWarning(`attempting to set same route: ${fullPath}${search}`);

			// Also update window.location to trigger BrowserRouter's popstate listener
			// This ensures React Router detects the navigation change
			window.history.pushState({}, '', url);

			// Manually dispatch popstate event to trigger BrowserRouter update
			window.dispatchEvent(new PopStateEvent('popstate', {state: {}}));
		} catch (e: any) {
			this.logError(`cannot resolve route for route: `, route, e);
			throw e;
		}
	}

	goToRouteByKey(routeKey: string, params?: Partial<RouteParams>, hash?: string) {
		const route = this.getRouteByKey(routeKey);
		if (!route)
			throw new BadImplementationException(`Cannot find route for key: ${routeKey}`);

		this.goToRoute(route, params, hash);
	}

	getRouteByPath(pathname: string): TS_Route | undefined {
		return this.routesMapByPath[pathname];
	}

	navigateToUrl(url: string) {
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			this.navigateToPath(url);
			return;
		}

		const target = new URL(url);
		if (target.origin !== window.location.origin) {
			window.location.href = url;
			return;
		}

		this.navigateToPath(`${target.pathname}${target.search}${target.hash}`);
	}

	private navigateToPath(pathWithQuery: string) {
		const hashIndex = pathWithQuery.indexOf('#');
		const withoutHash = hashIndex >= 0 ? pathWithQuery.substring(0, hashIndex) : pathWithQuery;
		const hash = hashIndex >= 0 ? pathWithQuery.substring(hashIndex + 1) : undefined;
		const queryIndex = withoutHash.indexOf('?');
		const pathname = queryIndex >= 0 ? withoutHash.substring(0, queryIndex) : withoutHash;
		const search = queryIndex >= 0 ? withoutHash.substring(queryIndex) : '';

		const route = this.getRouteByPath(pathname);
		if (route) {
			const params: RouteParams = {};
			if (search.length > 0) {
				const searchParams = new URLSearchParams(search.startsWith('?') ? search.substring(1) : search);
				searchParams.forEach((value, key) => {
					params[key] = value;
				});
			}
			this.goToRoute(route, params, hash);
			return;
		}

		this.push({pathname, search: search || undefined, hash: hash ? `#${hash}` : undefined});
	}

	redirect<P extends RouteParams>(route: TS_Route<P>, params?: P) {
		const url = composeUrl(this.getFullPath(route.key), params);
		return <Navigate to={url}/>;
	}

	generateRoutes(rootRoute: TS_Route) {
		this.buildRouteMap(rootRoute);
		if (!this.RoutesRenderer) {
			this.RoutesRenderer = () => <Routes>
				{this.routeBuilder(rootRoute)}
			</Routes>;
		}

		return <BrowserRouter>
			<this.RoutesRenderer/>
		</BrowserRouter>;
	}

	buildRouteMap(route: TS_Route, _path: string = '') {
		this.routesMapByKey[route.key] = {route, fullPath: _path};
		this.routesMapByPath[_path] = route;
		// Collapse duplicate slashes when composing child paths: a nested empty-path
		// layout route (e.g. Landing resolves to '/') would otherwise yield '//child',
		// which the browser treats as a protocol-relative URL — '//org-details' becomes
		// 'https://org-details/' and throws a cross-origin SecurityError on pushState.
		route.children?.forEach(child => this.buildRouteMap(child, `${_path}/${child.path}`.replace(/\/{2,}/g, '/')));
	}

	private routeBuilder = (route: TS_Route<any>) => {
		this.logDebug(`building route for: ${route.key}`);

		const path = this.routesMapByKey[route.key].fullPath;
		const routes = route.children || [];
		const indicesRoutes = routes?.filter(route => route.index);
		if (indicesRoutes && indicesRoutes.length > 1)
			throw new BadImplementationException(`more than one index route found in ${path}: ${indicesRoutes.map(r => r.key).join(', ')}`);

		const indexRoute = indicesRoutes?.[0];

		let _indexRoute;
		if (indexRoute) {
			const Component = this.resolveRouteComponent(indexRoute);
			if (indexRoute.path) {
				this.logDebug(`index route redirect to path: ${path}/${indexRoute.path}`);
				_indexRoute = <Route index element={<Navigate to={`${path}/${indexRoute.path}`}/>}/>;
			} else {
				this.logDebug(`index route render component: ${path}/${indexRoute.path}`);
				_indexRoute = <Route index Component={Component} element={indexRoute.element}/>;
			}
		}

		if (route.fallback)
			this.logDebug(`fallback: ${path}`);

		const children = route.children?.filter(child => {
			if (child.index && !child.path)
				return false;

			const isEnabled = child.enabled?.() ?? true;
			if (!isEnabled) {
				// Routine while permissions/feature flags are unresolved — info, not
				// warning. The actual "stuck" anomaly is the fallback firing (below).
				const childFullPath = this.routesMapByKey[child.key]?.fullPath;
				this.logInfo(`[routing] route EXCLUDED (enabled()===false): key='${child.key}' fullPath='${childFullPath}'`);
			} else {
				this.logDebug(`[routing] route included: key='${child.key}' fullPath='${this.routesMapByKey[child.key]?.fullPath}'`);
			}
			return isEnabled;
		}) ?? [];
		const Component = this.resolveRouteComponent(route);
		return <Route key={route.key} path={route.path} Component={Component} element={route.element}>
			{_indexRoute}
			{children.map(route => this.routeBuilder(route))}
			{route.fallback && <Route path="*" element={<RoutingFallbackRedirect to={path || '/'}/>}/>}
		</Route>;
	};

	private resolveRouteComponent = (route: TS_Route) => {
		return route.Component;
	};

	getRouteByKey(routeKey: string): TS_Route | undefined {
		return this.routesMapByKey[routeKey]?.route;
	}

	getFullPath(routeKey: string): string {
		const route = this.routesMapByKey[routeKey];
		if (!route)
			throw new BadImplementationException(`Cannot find full path for route key: ${routeKey}`);

		return route.fullPath;
	}

	getCurrentRouteKey() {
		return this.routesMapByPath[window.location.pathname];
	}

	// ######################## Query Param Methods ########################

	/**
	 * Get all query parameters from the current URL (decoded)
	 */
	getQueryParams(): UrlQueryParams {
		const params = this.getEncodedQueryParams();
		_keys(params).forEach(key => {
			const _param = params[key];
			if (!exists(_param))
				return;

			const value = `${params[key]}`;
			params[key] = decodeURIComponent(value);
		});
		return params;
	}

	/**
	 * Get a single query parameter from the current URL
	 * @param key - The query parameter key
	 * @returns The decoded value, null if key exists but value is empty, or undefined if key doesn't exist
	 */
	getQueryParameter(key: string): string | null | undefined {
		const queryParams = this.getQueryParams();
		const value = queryParams[key];
		if (value === undefined && Object.keys(queryParams).includes(key))
			return null;

		return value;
	}

	/**
	 * Replace all query parameters on the current route
	 * @param queryParams - The query parameters to set
	 */
	setQuery(queryParams: UrlQueryParams) {
		const encodedQueryParams = this.encodeUrlParams(queryParams);
		this.updateQueryParams(encodedQueryParams);
	}

	/**
	 * Add or update a single query parameter on the current route
	 * @param key - The query parameter key
	 * @param value - The query parameter value
	 */
	addQueryParam(key: string, value: string) {
		const decodedQueryParams = this.getQueryParams();
		decodedQueryParams[key] = value;
		this.updateQueryParams(decodedQueryParams);
	}

	/**
	 * Remove a single query parameter from the current route
	 * @param key - The query parameter key to remove
	 */
	removeQueryParam(key: string) {
		const encodedQueryParams = this.getEncodedQueryParams();
		delete encodedQueryParams[key];
		this.updateQueryParams(encodedQueryParams);
	}

	// ######################## URL Utility Methods ########################

	/**
	 * Get the current location object (compatible with BrowserHistory.getCurrent())
	 * @returns Object with pathname and search properties
	 */
	getCurrent(): { pathname: string; search: string; hash?: string; state?: any; key?: string } {
		return {
			pathname: window.location.pathname,
			search: window.location.search,
			hash: window.location.hash,
		};
	}

	/**
	 * Get the current URL pathname
	 * @returns The current pathname
	 */
	getCurrentUrl(): string {
		return window.location.pathname;
	}

	/**
	 * Get the window origin
	 * @returns The origin (protocol + hostname + port)
	 */
	getOrigin(): string {
		return window.location.origin;
	}

	// ######################## Navigation Methods ########################

	/**
	 * Convert location descriptor to URL string using composeUrl
	 */
	private locationToUrl(location: { pathname: string; search?: string; hash?: string }): string {
		// Parse search params if provided as string
		const params: { [key: string]: string } = {};
		if (location.search) {
			const searchParams = new URLSearchParams(location.search.startsWith('?') ? location.search.substring(1) : location.search);
			searchParams.forEach((value, key) => {
				params[key] = value;
			});
		}
		const hash = location.hash?.startsWith('#') ? location.hash.substring(1) : location.hash;
		return composeUrl(location.pathname, params, hash);
	}

	/**
	 * Navigate to a pathname with optional query params (adds to history)
	 * @param location - Location descriptor with pathname and optional search
	 */
	push(location: { pathname: string; search?: string; hash?: string }) {
		const url = this.locationToUrl(location);
		window.history.pushState({}, '', url);
		window.dispatchEvent(new PopStateEvent('popstate', {state: {}}));
	}

	/**
	 * Replace current history entry with new pathname and optional query params
	 * @param location - Location descriptor with pathname and optional search
	 */
	replace(location: { pathname: string; search?: string; hash?: string }) {
		const url = this.locationToUrl(location);
		window.history.replaceState({}, '', url);
		window.dispatchEvent(new PopStateEvent('popstate', {state: {}}));
	}

	// ######################## Private Helper Methods ########################

	private getEncodedQueryParams(): UrlQueryParams {
		const queryParams: UrlQueryParams = {};
		let queryAsString = window.location.search;
		if (!queryAsString || queryAsString.length === 0)
			return {};

		while (queryAsString.startsWith('?') || queryAsString.startsWith('/?')) {
			if (queryAsString.startsWith('?'))
				queryAsString = queryAsString.substring(1);
			else if (queryAsString.startsWith('/?'))
				queryAsString = queryAsString.substring(2);
			else
				break;
		}

		const query = queryAsString.split('&');
		return query.map(param => {
			const parts = param.split('=');
			return {key: parts[0], value: parts[1]?.length === 0 ? undefined : parts[1]};
		}).reduce((toRet, param) => {
			toRet[param.key] = param.value;
			return toRet;
		}, queryParams);
	}

	private composeQuery(queryParams?: UrlQueryParams): string {
		const queryAsString = composeQueryParams(queryParams);
		if (queryAsString.length === 0)
			return '';

		return queryAsString;
	}

	private encodeUrlParams(queryParams?: UrlQueryParams): UrlQueryParams {
		const encodedQueryParams = {...queryParams};
		_keys(encodedQueryParams).forEach(key => {
			const value = encodedQueryParams[key];
			if (!value) {
				delete encodedQueryParams[key];
				return;
			}

			encodedQueryParams[key] = encodeURIComponent(value);
		});
		return encodedQueryParams;
	}

	private updateQueryParams(encodedQueryParams: UrlQueryParams) {
		const search = this.composeQuery(encodedQueryParams);
		const url = `${window.location.pathname}${search ? `?${search}` : ''}`;
		window.history.replaceState({}, '', url);

		// Manually dispatch popstate event to trigger BrowserRouter update
		window.dispatchEvent(new PopStateEvent('popstate', {state: {}}));
	}

}

export const TS_NavLink = (props: {
	route: TS_Route;
	ignoreClickOnSameRoute?: boolean;
} & Partial<NavLinkProps>) => {
	const {route, children, ignoreClickOnSameRoute, ..._props} = props;
	const fullPath = ModuleFE_Routing.getFullPath(route.key);
	if (!fullPath)
		throw new BadImplementationException(`Route with key ${route.key} is not defined in routing module`);

	return <NavLink
		{..._props}
		to={fullPath}
		key={route.key}
		onClick={e => {
			const pathname = window.location.pathname;
			if (props.ignoreClickOnSameRoute && pathname === fullPath)
				stopPropagation(e);
		}}
		onMouseUp={e => mouseEventHandler(e, {
			middle: () => window.open(fullPath, '_blank'),
		})}
	>{children}</NavLink>;
};

/**
 * Catch-all fallback redirect. Behaves identically to the previous inline
 * `<Navigate to={...}/>` but logs (once, on mount) the attempted path and the
 * redirect target — this is the single most useful signal for the
 * "stuck on root / cannot navigate" condition (a fallback firing because the
 * intended route was excluded from the tree).
 */
const RoutingFallbackRedirect = (props: { to: string }) => {
	useEffect(() => {
		ModuleFE_Routing.logWarning(`[routing] fallback fired: attempted='${window.location.pathname}', redirectingTo='${props.to}'`);
	}, []);
	return <Navigate to={props.to}/>;
};

export const ModuleFE_Routing = new ModuleFE_Routing_Class();

// ######################## Utility Functions ########################
