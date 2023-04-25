import * as React from 'react';
import {BrowserRouter, Navigate, NavigateFunction, NavLink, NavLinkProps, Route, Routes} from 'react-router-dom';
import {TS_Route} from './types';
import {BadImplementationException, composeUrl, Module, removeItemFromArray} from '@nu-art/ts-common';
import {LocationChangeListener} from './LocationChangeListener';
import {QueryParams} from '../../../shared';
import {mouseEventHandler} from '../../utils/tools';


class ModuleFE_RoutingV2_Class
	extends Module<{}> {

	// ######################## Inner Data ########################

	private routesMapByKey: { [key: string]: { route: TS_Route, fullPath: string } } = {};
	private routesMapByPath: { [fullPath: string]: TS_Route } = {};
	private navigate!: NavigateFunction;

	// ######################## Public Functions ########################

	goToRoute<P extends QueryParams>(route: TS_Route<P>, params?: P) {
		const fullPath = this.getFullPath(route.key);
		try {
			const url = composeUrl(fullPath, params);
			if (window.location.href === url)
				return this.logWarning(`attempting to set same route: ${url}`);

			this.navigate(url);
		} catch (e: any) {
			this.logError(`cannot resolve route for route: `, route, e);
			throw e;
		}
	}

	generateRoutes(rootRoute: TS_Route) {
		const element = this.routeBuilder(rootRoute);
		return <BrowserRouter>
			<LocationChangeListener/>
			<Routes>
				{element}
			</Routes>
		</BrowserRouter>;
	}

	private routeBuilder = (route: TS_Route<any>, _path: string = '') => {
		const path = `${_path}/`;
		this.routesMapByKey[route.key] = {route, fullPath: _path};
		this.routesMapByPath[_path] = route;

		const routes = route.children || [];
		const indicesRoutes = routes?.filter(route => route.index);
		if (indicesRoutes && indicesRoutes.length > 1)
			throw new BadImplementationException(`more than one index route found in ${path}: ${indicesRoutes.map(r => r.key).join(', ')}`);

		const indexRoute = indicesRoutes?.[0];
		if (indexRoute)
			console.log(`index: ${path}${indexRoute.path}`);

		if (route.fallback)
			console.log(`fallback: ${path}`);

		let _indexRoute;
		if (indexRoute)
			if (indexRoute.path)
				_indexRoute = <Route index element={<Navigate to={`${path}${indexRoute.path}`}/>}/>;
			else {
				_indexRoute = <Route index Component={indexRoute.Component} element={indexRoute.element}/>;
				removeItemFromArray(routes, indexRoute);
			}

		return <Route key={route.key} path={route.path} Component={route.Component} element={route.element}>
			{_indexRoute}
			{route.children?.map(route => this.routeBuilder(route, `${path}${route.path}`))}
			{route.fallback && <Route path="*" element={<Navigate to={path}/>}/>}
		</Route>;
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

	setNavigate(navigate: NavigateFunction) {
		this.navigate = navigate;
	}
}

export const TS_NavLink = (props: { route: TS_Route } & Partial<NavLinkProps>) => {
	const {route, children, ..._props} = props;

	const fullPath = ModuleFE_RoutingV2.getFullPath(route.key);
	if (!fullPath)
		throw new BadImplementationException(`Route with key ${route.key} is not defined in routing module`);

	return <NavLink
		{..._props}
		to={fullPath}
		key={route.key}
		onMouseUp={e => mouseEventHandler(e, {
			middle: () => window.open(fullPath, '_blank'),
		})}
	>{children}</NavLink>;
};

export const ModuleFE_RoutingV2 = new ModuleFE_RoutingV2_Class();