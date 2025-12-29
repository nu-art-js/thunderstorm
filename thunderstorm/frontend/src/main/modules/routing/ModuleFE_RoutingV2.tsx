import {ComponentClass, FunctionComponent} from 'react';
import {BrowserRouter, Navigate, NavLink, NavLinkProps, Route, Routes} from 'react-router-dom';
import {createBrowserHistory, History, LocationDescriptorObject} from 'history';
import {TS_Route} from './types.js';
import {BadImplementationException, composeQueryParams, composeUrl, exists, Module, removeItemFromArray, _keys} from '@nu-art/ts-common';
import {LocationChangeListener} from './LocationChangeListener.js';
import {QueryParams, UrlQueryParams} from '@nu-art/thunderstorm-shared';
import {mouseEventHandler, stopPropagation} from '../../utils/tools.js';
import {AwaitModules} from '../../components/AwaitModules/AwaitModules.js';
import {AwaitSync} from '../../components/AwaitSync/AwaitSync.js';


class ModuleFE_RoutingV2_Class
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
	private readonly history: History<any>;

	constructor() {
		super();
		this.history = createBrowserHistory();
	}

	// ######################## Public Functions ########################

	goToRoute<P extends QueryParams>(route: TS_Route<P>, params?: Partial<P>) {
		const fullPath = this.getFullPath(route.key);
		try {
			const url = composeUrl(fullPath, params, window.location.hash);
			if (window.location.href === url)
				return this.logWarning(`attempting to set same route: ${url}`);

			this.history.push(url);
		} catch (e: any) {
			this.logError(`cannot resolve route for route: `, route, e);
			throw e;
		}
	}

	redirect<P extends QueryParams>(route: TS_Route<P>, params?: Partial<P>) {
		const url = composeUrl(this.getFullPath(route.key), params);
		return <Navigate to={url}/>;
	}

	generateRoutes(rootRoute: TS_Route) {
		// This needs to be a component in order to be build the routes on rendering after modules are awaited
		this.buildRouteMap(rootRoute);
		const RoutesRenderer = () => <Routes>
			{this.routeBuilder(rootRoute)}
		</Routes>;

		return <BrowserRouter>
			<LocationChangeListener/>
			<RoutesRenderer/>
		</BrowserRouter>;
	}

	buildRouteMap(route: TS_Route, _path: string = '') {
		const path = `${_path}/`;
		this.routesMapByKey[route.key] = {route, fullPath: _path};
		this.routesMapByPath[_path] = route;
		route.children?.map(route => this.buildRouteMap(route, `${path}${route.path}`));
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
				// force redirect to a different route
				_indexRoute = <Route index element={<Navigate to={`${path}/${indexRoute.path}`}/>}/>;
			} else {
				// default index route renderer
				this.logDebug(`index route render component: ${path}/${indexRoute.path}`);
				_indexRoute = <Route index Component={Component} element={indexRoute.element}/>;
				removeItemFromArray(routes, indexRoute);
			}
		}

		if (route.fallback)
			this.logDebug(`fallback: ${path}`);

		const children = route.children?.filter(route => {
			return route.enabled?.() ?? true;
		}) ?? [];
		const Component = this.resolveRouteComponent(route);
		return <Route key={route.key} path={route.path} Component={Component} element={route.element}>
			{_indexRoute}
			{children.map(route => this.routeBuilder(route))}
			{/*{route.fallback && <Route path="*" element={<Navigate to={path}/>}/>}*/}
		</Route>;
	};

	private resolveRouteComponent = (route: TS_Route) => {
		if (!route.Component)
			return undefined;

		const shouldAwaitModules = !!route.modulesToAwait;
		const shouldAwaitSync = !!route.awaitSync;

		//No awaiting of any type
		if (!shouldAwaitModules && !shouldAwaitSync)
			return route.Component;

		//Awaiting both modules and sync
		if (shouldAwaitModules && shouldAwaitSync) {
			if (route.Component.prototype?.render) {
				const Component = route.Component as ComponentClass;
				return () => <AwaitSync customLoader={route.awaitSyncLoader}>
					<AwaitModules modules={route.modulesToAwait!}
												customLoader={route.awaitModulesLoader}><Component/></AwaitModules>
				</AwaitSync>;
			}
			const component = route.Component as FunctionComponent;
			return () => <AwaitSync customLoader={route.awaitSyncLoader}>
				<AwaitModules modules={route.modulesToAwait!}
											customLoader={route.awaitModulesLoader}>{component({})}</AwaitModules>
			</AwaitSync>;
		}

		//Awaiting only modules
		if (shouldAwaitModules && !shouldAwaitSync) {
			//route.Component is a class component
			if (route.Component.prototype?.render) {
				const Component = route.Component as ComponentClass;
				return () => <AwaitModules modules={route.modulesToAwait!} customLoader={route.awaitModulesLoader}><Component/></AwaitModules>;
			}

			//route.Component is a function component
			const component = route.Component as FunctionComponent;
			return () => <AwaitModules modules={route.modulesToAwait!}
																 customLoader={route.awaitModulesLoader}>{component({})}</AwaitModules>;
		}

		//Awaiting only sync
		if (shouldAwaitModules && !shouldAwaitSync) {
			if (route.Component.prototype.render) {
				const Component = route.Component as ComponentClass;
				return () => <AwaitSync customLoader={route.awaitSyncLoader}><Component/></AwaitSync>;
			}

			//route.Component is a function component
			const component = route.Component as FunctionComponent;
			return () => <AwaitSync customLoader={route.awaitSyncLoader}>{component({})}</AwaitSync>;
		}
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
	 * Navigate to a pathname with optional query params (adds to history)
	 * @param location - Location descriptor with pathname and optional search
	 */
	push(location: { pathname: string; search?: string; hash?: string }) {
		const url = this.composeLocationUrl(location);
		this.history.push(url);
	}

	/**
	 * Replace current history entry with new pathname and optional query params
	 * @param location - Location descriptor with pathname and optional search
	 */
	replace(location: { pathname: string; search?: string; hash?: string }) {
		const url = this.composeLocationUrl(location);
		this.history.replace(url);
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

	private createLocationDataFromQueryParams(encodedQueryParams?: UrlQueryParams, pathname: string = window.location.pathname): string {
		const cleanPathname = !pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.length - 1);
		const search = encodedQueryParams ? this.composeQuery(encodedQueryParams) : '';
		return search.length > 0 ? `${cleanPathname}?${search}` : cleanPathname;
	}

	private updateQueryParams(encodedQueryParams: UrlQueryParams) {
		const url = this.createLocationDataFromQueryParams(encodedQueryParams);
		this.history.replace(url);
	}

	private composeLocationUrl(location: { pathname: string; search?: string; hash?: string }): string {
		const cleanPathname = !location.pathname.endsWith('/') ? location.pathname : location.pathname.substring(0, location.pathname.length - 1);
		const search = location.search || '';
		const hash = location.hash || '';
		return `${cleanPathname}${search}${hash}`;
	}
}

export const TS_NavLink = (props: {
	route: TS_Route;
	ignoreClickOnSameRoute?: boolean;
} & Partial<NavLinkProps>) => {
	const {route, children, ignoreClickOnSameRoute, ..._props} = props;
	const fullPath = ModuleFE_RoutingV2.getFullPath(route.key);
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

export const ModuleFE_RoutingV2 = new ModuleFE_RoutingV2_Class();

// ######################## Utility Functions ########################

/**
 * Encode URL query parameters
 * @param queryParams - Query parameters to encode
 * @returns Encoded query parameters
 */
export function encodeUrlParams(queryParams?: UrlQueryParams): UrlQueryParams {
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

/**
 * Compose a query string from query parameters
 * @param queryParams - Query parameters to compose
 * @returns Query string (without leading ?)
 */
export function composeQuery(queryParams?: UrlQueryParams): string {
	const queryAsString = composeQueryParams(queryParams);
	if (queryAsString.length === 0)
		return '';

	return queryAsString;
}

/**
 * Compose a full URL with query parameters
 * @param url - Base URL
 * @param queryParams - Optional query parameters
 * @returns Full URL with query string
 */
export function composeURL(url: string, queryParams?: UrlQueryParams): string {
	const queryAsString = composeQuery(queryParams);
	return `${url}${queryAsString.length > 0 ? `?${queryAsString}` : ''}`;
}