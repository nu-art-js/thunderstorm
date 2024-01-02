import * as React from 'react';
import {ComponentClass, FunctionComponent} from 'react';
import {BrowserRouter, Navigate, NavigateFunction, NavLink, NavLinkProps, Route, Routes} from 'react-router-dom';
import {TS_Route} from './types';
import {BadImplementationException, composeUrl, Module, removeItemFromArray} from '@nu-art/ts-common';
import {LocationChangeListener} from './LocationChangeListener';
import {QueryParams} from '../../../shared';
import {mouseEventHandler} from '../../utils/tools';
import {AwaitModules} from '../../components/AwaitModules/AwaitModules';


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
	private navigate!: NavigateFunction;

	// constructor() {
	// 	super();
	// 	this.setMinLevel(LogLevel.Debug);
	// }

	// ######################## Public Functions ########################

	goToRoute<P extends QueryParams>(route: TS_Route<P>, params?: Partial<P>) {
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

	redirect<P extends QueryParams>(route: TS_Route<P>, params?: Partial<P>) {
		const url = composeUrl(this.getFullPath(route.key), params);
		return <Navigate to={url}/>;
	}

	generateRoutes(rootRoute: TS_Route) {
		// This needs to be a component in order to be build the routes on rendering after modules are awaited
		const RoutesRenderer = () => <Routes>
			{this.routeBuilder(rootRoute)}
		</Routes>;

		return <BrowserRouter>
			<LocationChangeListener/>
			<RoutesRenderer/>
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
			this.logDebug(`index: ${path}${indexRoute.path}`);

		if (route.fallback)
			this.logDebug(`fallback: ${path}`);

		let _indexRoute;
		if (indexRoute) {
			const Component = this.resolveRouteComponent(indexRoute);
			if (indexRoute.path)
				// force redirect to a different route
				_indexRoute = <Route index element={<Navigate to={`${path}${indexRoute.path}`}/>}/>;
			else {
				// default index route renderer
				_indexRoute = <Route index Component={Component} element={indexRoute.element}/>;
				removeItemFromArray(routes, indexRoute);
			}
		}

		const Component = this.resolveRouteComponent(route);
		return <Route key={route.key} path={route.path} Component={Component} element={route.element}>
			{_indexRoute}
			{route.children?.filter(route => route.enabled?.() ?? true).map(route => this.routeBuilder(route, `${path}${route.path}`))}
			{route.fallback && <Route path="*" element={<Navigate to={path}/>}/>}
		</Route>;
	};

	private resolveRouteComponent = (route: TS_Route) => {
		if (!route.Component)
			return undefined;

		if (!route.modulesToAwait?.length)
			return route.Component;

		//route.Component is a class component
		if (route.Component.prototype.render) {
			const Component = route.Component as ComponentClass;
			return () => <AwaitModules modules={route.modulesToAwait!}
									   customLoader={route.awaitLoader}><Component/></AwaitModules>;
		}

		//route.Component is a function component
		const component = route.Component as FunctionComponent;
		return () => <AwaitModules modules={route.modulesToAwait!}
								   customLoader={route.awaitLoader}>{component({})}</AwaitModules>;
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

export const TS_NavLink = (props: {
	route: TS_Route
} & Partial<NavLinkProps>) => {
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