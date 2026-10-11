import {useEffect} from 'react';
import {BrowserRouter, Navigate, NavLink, NavLinkProps, Route, Routes, useLocation} from 'react-router-dom';
import {TS_Route} from './types.js';
import {TS_RoutePage} from './TS_RoutePage.js';
import {UrlQueryParams} from '@nu-art/api-types';
import {
	BadImplementationException,
	composeQueryParams,
	composeUrl,
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
		window.addEventListener('popstate', () => {
			this.logInfo(`[routing] url popstate href='${window.location.href}'`);
			dispatch_onLocationChanged.dispatchUI(window.location.pathname);
		});
	}

	protected init() {
		this.logInfo(`[routing] boot href='${window.location.href}'`);
	}

	// ######################## Public Functions ########################

	goToRoute<P extends RouteParams>(route: TS_Route<P>, params?: Partial<P>, hash?: string) {
		const fullPath = this.getFullPath(route.key);
		this.logDebug(`[routing] goToRoute: key='${route.key}' resolved fullPath='${fullPath}'`);
		try {
			const queryString = composeQueryParams(params);
			const search = queryString.length > 0 ? `?${queryString}` : '';
			const url = composeUrl(fullPath, params, hash);

			if (!this.navigateIfChanged(url, 'push'))
				return this.logWarning(`attempting to set same route: ${fullPath}${search}`);
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
			this.logInfo(`[routing] url assign: '${window.location.href}' → '${url}'`);
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
			const element = this.resolveRouteElement(indexRoute);
			if (indexRoute.path) {
				const indexTarget = `${path}/${indexRoute.path}`.replace(/\/{2,}/g, '/');
				this.logDebug(`index route redirect to path: ${indexTarget}`);
				_indexRoute = <Route index element={<IndexPathRedirect to={indexTarget}/>}/>;
			} else {
				this.logDebug(`index route render component: ${path}/${indexRoute.path}`);
				_indexRoute = <Route index element={element}/>;
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
		const element = this.resolveRouteElement(route);
		return <Route key={route.key} path={route.path} element={element}>
			{_indexRoute}
			{children.map(route => this.routeBuilder(route))}
			{route.fallback && <Route path="*" element={<RoutingFallbackRedirect to={path || '/'}/>}/>}
		</Route>;
	};

	private resolveRouteElement = (route: TS_Route): React.ReactNode | undefined => {
		if (route.element)
			return route.element;

		if (!route.Component)
			return undefined;

		if (route.paramKeys?.length)
			return <TS_RoutePage route={route}/>;

		return <route.Component/>;
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
		const params: UrlQueryParams = {};
		new URL(window.location.href).searchParams.forEach((value, key) => {
			params[key] = value.length === 0 ? undefined : value;
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
		const url = new URL(window.location.href);
		url.search = '';
		Object.keys(queryParams).forEach(key => {
			const value = queryParams[key];
			if (!value)
				return;

			url.searchParams.set(key, value);
		});
		this.replaceUrl(url);
	}

	/**
	 * Add or update a single query parameter on the current route
	 * @param key - The query parameter key
	 * @param value - The query parameter value
	 */
	addQueryParam(key: string, value: string) {
		const url = new URL(window.location.href);
		url.searchParams.set(key, value);
		this.replaceUrl(url);
	}

	/**
	 * Remove a single query parameter from the current route
	 * @param key - The query parameter key to remove
	 */
	removeQueryParam(key: string) {
		const url = new URL(window.location.href);
		url.searchParams.delete(key);
		this.replaceUrl(url);
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

	private locationToUrl(location: { pathname: string; search?: string; hash?: string }): string {
		const url = new URL(location.pathname, window.location.origin);
		url.search = location.search ?? '';
		url.hash = location.hash ?? '';
		return `${url.pathname}${url.search}${url.hash}`;
	}

	/**
	 * Navigate to a pathname with optional query params (adds to history)
	 * @param location - Location descriptor with pathname and optional search
	 */
	push(location: { pathname: string; search?: string; hash?: string }) {
		const url = this.locationToUrl(location);
		this.navigateIfChanged(url, 'push');
	}

	/**
	 * Replace current history entry with new pathname and optional query params
	 * @param location - Location descriptor with pathname and optional search
	 */
	replace(location: { pathname: string; search?: string; hash?: string }) {
		const url = this.locationToUrl(location);
		this.navigateIfChanged(url, 'replace');
	}

	// ######################## Private Helper Methods ########################

	private replaceUrl(url: URL) {
		this.navigateIfChanged(`${url.pathname}${url.search}${url.hash}`, 'replace');
	}

	private getCurrentLocationUrl(): string {
		return `${window.location.pathname}${window.location.search}${window.location.hash}`;
	}

	private resolveLocationUrl(url: string): string {
		const resolved = new URL(url, window.location.origin);
		return `${resolved.pathname}${resolved.search}${resolved.hash}`;
	}

	private navigateIfChanged(url: string, mode: 'push' | 'replace'): boolean {
		const from = this.getCurrentLocationUrl();
		const to = this.resolveLocationUrl(url);
		if (to === from)
			return false;

		this.logInfo(`[routing] url ${mode}: '${from}' → '${to}'`);
		if (mode === 'push')
			window.history.pushState({}, '', url);
		else
			window.history.replaceState({}, '', url);

		window.dispatchEvent(new PopStateEvent('popstate', {state: {}}));
		return true;
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

/** Index redirect that keeps the current query and hash (handoff `?Authorization=`). */
const IndexPathRedirect = (props: {to: string}) => {
	const location = useLocation();
	return <Navigate to={{pathname: props.to, search: location.search, hash: location.hash}} replace/>;
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
		ModuleFE_Routing.logWarning(`[routing] fallback fired: attempted='${window.location.pathname}${window.location.search}', redirectingTo='${props.to}'`);
	}, []);
	return <Navigate to={props.to}/>;
};

export const ModuleFE_Routing = new ModuleFE_Routing_Class();

// ######################## Utility Functions ########################
