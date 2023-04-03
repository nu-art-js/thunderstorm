import * as React from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import {TS_Route, TS_RouteTreeNode} from './types';
import {_values, BadImplementationException, Module, removeFromArrayByIndex, sortArray} from '@nu-art/ts-common';
import {LocationChangeListener} from './LocationChangeListener';

const indexIdentifier = '__index__';
const rootIdentifier = '__root__';

class ModuleFE_RoutingV2_Class
	extends Module<{}> {

	// ######################## Inner Data ########################

	private routes: TS_Route[] = [];
	private routesTree: TS_RouteTreeNode = {} as TS_RouteTreeNode;

	// ######################## Inner Functions ########################

	private getParentRoute = (path: string): TS_RouteTreeNode | undefined => {
		const routeSteps = this.resolveRouteSteps(path);
		removeFromArrayByIndex(routeSteps, routeSteps.length - 1); //Remove last step (which is the routes own relative node)
		let parentRoute: TS_RouteTreeNode | undefined = this.routesTree;
		routeSteps.slice(1).forEach(step => parentRoute = parentRoute?.children?.[step]);
		return parentRoute;
	};

	private resolveRouteSteps = (path: string) => {
		const steps = path.split('/');
		steps[0] = rootIdentifier;
		return steps;
	};

	private setRootRoute = (root: TS_Route) => {
		this.routesTree = {relativePath: rootIdentifier, element: root.element, key: root.key};
	};

	private validateRoute = (route: TS_Route) => {
		//If the route path does not start with /
		if (!route.path.startsWith('/'))
			throw new BadImplementationException(`Route path must start with "/" (forward slash): ${route.path}`);

		const parentRoute = this.getParentRoute(route.path);

		//If the route does not have a parent and isn't a root route
		if (!parentRoute)
			throw new BadImplementationException(`Non root route with no parent: ${route.path}`);

		const steps = this.resolveRouteSteps(route.path);
		const relativePath = steps[steps.length - 1];

		//If the route already exists
		if (parentRoute.children?.[relativePath])
			throw new BadImplementationException(`Duplicate route ${route.path}`);

		if (route.fallback && parentRoute.children?.[indexIdentifier])
			throw new BadImplementationException(`Route ${parentRoute.relativePath} has more than one child defined as a fallback`);
	};

	// ######################## Public Functions ########################

	setRoutes = (routes: TS_Route[]) => {
		this.routes = routes;
		const root = this.routes.find(item => item.path === '/');
		if (!root)
			throw new BadImplementationException('Must provide a root route with path /');

		this.routes.forEach(route => {
			if (route.path.endsWith('/') && route !== root)
				route.path = route.path.substring(0, route.path.length - 1);
		});
	};

	generateRoutes = () => {
		this.generateRoutesTree(this.routes);
		return <>
			<LocationChangeListener/>
			<Routes>
				{this.generateRoute(this.routesTree)}
			</Routes>
		</>;
	};

	generateRoutesTree = (routes: TS_Route[]) => {
		routes = sortArray(this.routes, route => route.path);
		routes.forEach(route => {
			if (route.path === '/')
				return this.setRootRoute(route);

			this.validateRoute(route);
			const parentRoute = this.getParentRoute(route.path)!;
			const steps = this.resolveRouteSteps(route.path);
			const relativePath = steps[steps.length - 1];

			//Init children obj if undefined
			if (!parentRoute.children)
				parentRoute.children = {
					'*': {key: `${parentRoute.key}-any`, relativePath: '*', element: () => this.createNavigate(parentRoute.key)},
				};

			//Set route in parent route
			parentRoute.children[relativePath] = {
				relativePath,
				key: route.key,
				element: route.element,
			};

			//Set parent route index if is fallback
			if (route.fallback) {
				parentRoute.children[indexIdentifier] = {
					relativePath: indexIdentifier,
					key: route.key + '-index',
					element: () => this.createNavigate(route.key),
				};
			}
		});
	};

	generateRoute = (route: TS_RouteTreeNode) => {
		const resolveRelativePath = (relativePath: string) => {
			switch (relativePath) {
				case indexIdentifier:
					return undefined;
				case rootIdentifier:
					return '/';
				default:
					return relativePath;
			}
		};

		const isIndex = route.relativePath === indexIdentifier;
		const Element = route.element!;
		const element = (route.element ? {element: <Element/>} : {});

		if (isIndex) {
			return <Route index {...element}/>;
		}

		if (!route.children) {
			return <Route path={resolveRelativePath(route.relativePath)} {...element}/>;
		}

		return <Route path={resolveRelativePath(route.relativePath)} {...element}>
			{..._values(route.children).sort((a, b) => a.relativePath === '*' ? 1 : -1).map(child => this.generateRoute(child))}
		</Route>;
	};

	createNavigate(routeKey: string) {
		const route = this.getRouteByKey(routeKey);
		if (!route)
			throw new BadImplementationException(`No route found for key ${routeKey}`);
		return <Navigate to={route.path}/>;
	}

	getRouteByKey(routeKey: string): TS_Route | undefined {
		return this.routes.find(route => route.key === routeKey);
	}

	getCurrentRouteKey() {
		const path = window.location.pathname;
		return this.routes.find(route => route.path === path)?.key;
	}
}

export const ModuleFE_RoutingV2 = new ModuleFE_RoutingV2_Class();