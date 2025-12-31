/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @deprecated This module is deprecated. Use ModuleFE_RoutingV2 instead.
 * 
 * Migration Guide:
 * 
 * ModuleFE_Routing uses an imperative API (addRoute, clearRoutes) while ModuleFE_RoutingV2 uses a declarative
 * route object API (TS_Route). Migration requires refactoring route definitions.
 * 
 * Key Differences:
 * - Old: ModuleFE_Routing.addRoute(key, path, component)
 * - New: Define TS_Route objects with key, path, Component properties
 * 
 * - Old: ModuleFE_Routing.goToRoute(key, params)
 * - New: ModuleFE_RoutingV2.goToRoute(routeObject, params)
 * 
 * - Old: ModuleFE_Routing.getRoutesMap()
 * - New: ModuleFE_RoutingV2.generateRoutes(rootRoute) - returns JSX
 * 
 * See ModuleFE_RoutingV2 and TS_Route type for the new API.
 * 
 * This module will be removed in a future version. Please migrate to ModuleFE_RoutingV2.
 */
import {_keys, addItemToArray, BadImplementationException, composeQueryParams, Module, RouteParams} from '@nu-art/ts-common';
import * as React from 'react';
import {defaultLinkNode, defaultNavLinkNode, defaultRouteNode, RoutePath} from './route.js';
import {ModuleFE_RoutingV2} from './ModuleFE_RoutingV2.js';
import {QueryParams} from '@nu-art/thunderstorm-shared';
import {Navigate, Routes} from 'react-router-dom';


/**
 * @deprecated Use ModuleFE_RoutingV2 instead. This class will be removed in a future version.
 * 
 * All functionality has been migrated to ModuleFE_RoutingV2. See file-level deprecation notice for migration guide.
 */
class ModuleFE_Routing_Class
	extends Module<{}> {
	private readonly routes: { [key: string]: RoutePath } = {};
	private readonly ordinalRoutes: string[] = [];

	private readonly createNavLinkNode: (route: RoutePath) => React.ReactElement;
	private readonly createRouteNode: (route: RoutePath) => React.ReactElement;
	private readonly createLinkNode: (route: RoutePath, node?: React.ReactNode) => React.ReactElement;

	constructor() {
		super();
		this.createNavLinkNode = defaultNavLinkNode;
		this.createLinkNode = defaultLinkNode;
		this.createRouteNode = defaultRouteNode;
	}

	init() {
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2 with TS_Route objects instead
	 * 
	 * Migration: Define routes as TS_Route objects and pass to ModuleFE_RoutingV2.generateRoutes()
	 */
	clearRoutes() {
		for (const item of this.ordinalRoutes) {
			delete this.routes[item];
		}
		this.ordinalRoutes.splice(0);
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2 with TS_Route objects instead
	 * 
	 * Migration:
	 * // Old:
	 * ModuleFE_Routing.addRoute('home', '/', HomeComponent);
	 * 
	 * // New:
	 * const route: TS_Route = { key: 'home', path: '/', Component: HomeComponent };
	 * // Then use ModuleFE_RoutingV2.generateRoutes(rootRoute) where rootRoute contains this route
	 */
	addRoute(key: string, route: string, component: React.ComponentClass<any, any> | string) {
		const previousRoute = this.routes[key];
		if (previousRoute)
			throw new BadImplementationException(
				`Route key '${key}' MUST be unique!!\n  Found two routes with matching key: '${route}' && '${previousRoute.path}'`);

		addItemToArray(this.ordinalRoutes, key);
		return this.routes[key] = new RoutePath(key, route, component);
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2.getRouteByKey() instead
	 * 
	 * Migration:
	 * // Old:
	 * const route = ModuleFE_Routing.getRoute(key);
	 * 
	 * // New:
	 * const route = ModuleFE_RoutingV2.getRouteByKey(key);
	 */
	getRoute(key: string) {
		const route = this.routes[key];
		if (!route)
			throw new BadImplementationException(`No Route for key '${key}'... Did you forget to add it??`);

		return route;
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2.getFullPath() instead
	 * 
	 * Migration:
	 * // Old:
	 * const path = ModuleFE_Routing.getPath(key);
	 * 
	 * // New:
	 * const path = ModuleFE_RoutingV2.getFullPath(key);
	 */
	getPath(key: string) {
		return this.getRoute(key).path;
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2.goToRoute() instead
	 * 
	 * Migration:
	 * // Old:
	 * ModuleFE_Routing.goToRoute(key, params);
	 * 
	 * // New:
	 * const route = ModuleFE_RoutingV2.getRouteByKey(key);
	 * if (route) ModuleFE_RoutingV2.goToRoute(route, params);
	 */
	goToRoute(key: string, params?: RouteParams) {
		const pathname = this.getPath(key);
		const search = composeQueryParams(params);

		ModuleFE_RoutingV2.push({pathname, search: search ? `?${search}` : ''});
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2.redirect() instead
	 * 
	 * Migration:
	 * // Old:
	 * return ModuleFE_Routing.redirect(key);
	 * 
	 * // New:
	 * const route = ModuleFE_RoutingV2.getRouteByKey(key);
	 * if (route) return ModuleFE_RoutingV2.redirect(route);
	 */
	redirect(key: string) {
		return <Navigate to={ModuleFE_Routing.getPath(key)}/>;
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2.getCurrentRouteKey() instead
	 * 
	 * Migration:
	 * // Old:
	 * const key = ModuleFE_Routing.getMyRouteKey();
	 * 
	 * // New:
	 * const route = ModuleFE_RoutingV2.getCurrentRouteKey();
	 * const key = route?.key;
	 */
	getMyRouteKey = () => Object.keys(this.routes).find(key => this.routes[key].path === ModuleFE_RoutingV2.getCurrent().pathname);

	/**
	 * @deprecated Use ModuleFE_RoutingV2 with TS_NavLink component instead
	 * 
	 * Migration: Use TS_NavLink component from ModuleFE_RoutingV2 with route objects
	 */
	// need to figure out how to create parameterized urls from this call !!
	getNavLinks(keys: string[]) {
		return keys.map(key => this.getRoute(key)).filter(route => route.visible && route.visible()).map(route => this.createNavLinkNode(route));
	}

	/**
	 * @deprecated Use TS_NavLink from ModuleFE_RoutingV2 instead
	 * 
	 * Migration: Use <TS_NavLink route={routeObject}> component
	 */
	getNavLink(key: string) {
		return this.createNavLinkNode(this.getRoute(key));
	}

	/**
	 * @deprecated Use standard React Router Link or TS_NavLink from ModuleFE_RoutingV2
	 */
	getLink(key: string) {
		return this.createLinkNode(this.getRoute(key));
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2.generateRoutes() instead
	 * 
	 * Migration:
	 * // Old:
	 * {ModuleFE_Routing.getRoutesMap()}
	 * 
	 * // New:
	 * {ModuleFE_RoutingV2.generateRoutes(rootRoute)}
	 */
	getRoutesMap(keys?: string[]) {
		return <Routes>
			{(keys || this.ordinalRoutes).map(key => this.createRouteNode(this.getRoute(key)))}
		</Routes>;
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2.getCurrentUrl() instead
	 * 
	 * Migration:
	 * // Old:
	 * const url = ModuleFE_Routing.getCurrentUrl();
	 * 
	 * // New:
	 * const url = ModuleFE_RoutingV2.getCurrentUrl();
	 */
	getCurrentUrl = () => window.location.href;

	private getEncodedQueryParams = (): QueryParams => {
		const queryParams: QueryParams = {};
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
			return {key: parts[0], value: parts[1]};
		}).reduce((toRet, param) => {
			if (param.key && param.value)
				toRet[param.key] = param.value;

			return toRet;
		}, queryParams);
	};

	/**
	 * @deprecated Use ModuleFE_RoutingV2.getQueryParams() instead
	 * 
	 * Migration:
	 * // Old:
	 * const params = ModuleFE_Routing.getSearch();
	 * 
	 * // New:
	 * const params = ModuleFE_RoutingV2.getQueryParams();
	 */
	getSearch() {
		const params = this.getEncodedQueryParams();
		_keys(params).forEach(key => {
			const value = `${params[key]}`;
			if (!value) {
				delete params[key];
				return;
			}

			params[key] = decodeURIComponent(value);
		});
		return params;
	}

	/**
	 * @deprecated Use ModuleFE_RoutingV2.push() or ModuleFE_RoutingV2.goToRoute() instead
	 * 
	 * Migration:
	 * // Old:
	 * ModuleFE_Routing.goToUrl('/path');
	 * 
	 * // New:
	 * ModuleFE_RoutingV2.push({pathname: '/path'});
	 */
	goToUrl = (url: string) => window.location.href = url;
}

/**
 * @deprecated Use ModuleFE_RoutingV2 instead. This export will be removed in a future version.
 * 
 * See file-level deprecation notice for migration guide.
 */
export const ModuleFE_Routing = new ModuleFE_Routing_Class();