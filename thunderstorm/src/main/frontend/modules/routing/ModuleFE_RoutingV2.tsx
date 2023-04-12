import * as React from 'react';
import {Navigate, NavigateFunction, Route, Routes} from 'react-router-dom';
import {TS_Route} from './types';
import {BadImplementationException, composeUrl, Module, removeItemFromArray} from '@nu-art/ts-common';
import {LocationChangeListener} from './LocationChangeListener';
import {QueryParams} from '../../../shared';


class ModuleFE_RoutingV2_Class
	extends Module<{}> {

	// ######################## Inner Data ########################

	private routesMapByKey: { [key: string]: { route: TS_Route, fullPath: string } } = {};
	private routesMapByPath: { [fullPath: string]: TS_Route } = {};
	private navigate!: NavigateFunction;

	// ######################## Public Functions ########################

	goToRoute<P extends QueryParams>(route: TS_Route<P>, params?: P) {
		this.navigate(composeUrl(this.routesMap[route.key].fullPath, params));
	}

	generateRoutes(rootRoute: TS_Route) {
		const element = this.routeBuilder(rootRoute);
		return <>
			<LocationChangeListener/>
			<Routes>
				{element}
			</Routes>
		</>;
	}

	private routeBuilder = (route: TS_Route<any>, _path: string = '') => {
		const path = `${_path}/`;
		console.log('route: ', `${route.key} - ${route.path} - ${path}`);
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

	getCurrentRouteKey() {
		return this.routesMapByPath[window.location.pathname];
	}

	setNavigate(navigate: NavigateFunction) {
		this.navigate = navigate;
	}
}

export const ModuleFE_RoutingV2 = new ModuleFE_RoutingV2_Class();