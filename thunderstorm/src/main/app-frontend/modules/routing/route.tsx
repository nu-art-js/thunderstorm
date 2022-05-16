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

import * as React from 'react';
import {Link, NavLink, Route} from 'react-router-dom';
import {ReactEntryComponentInjector} from '../component-loader/ReactEntryComponentInjector';

export type RouteParams = { [key: string]: string | number | (() => string | number) }

export class RoutePath {
	key: string;
	path: string;
	exact: boolean = false;
	component: React.ComponentClass | string;

	logMessage?: string;
	label?: React.ElementType | string;
	visible: () => boolean = () => !!this.label;
	enabled?: () => boolean;

	constructor(key: string, route: string, component: React.ComponentClass | string) {
		this.key = key;
		this.path = route;
		this.component = component;
	}

	setLogMessage(logMessage: string) {
		// @ts-ignore
		this.logMessage = logMessage;
		return this;
	}

	setLabel(label: React.ElementType | string) {
		// @ts-ignore
		this.label = label;
		return this;
	}

	setVisible(visible: () => boolean) {
		// @ts-ignore
		this.visible = visible;
		return this;
	}

	setEnabled(enabled: () => boolean) {
		// @ts-ignore
		this.enabled = enabled;
		return this;
	}

	setExact(exact: boolean) {
		// @ts-ignore
		this.exact = exact;
		return this;
	}

	compose(params?: RouteParams) {
		const paramsAsString = RoutePath.composeStringQuery(params);

		return this.path + paramsAsString;
	}

	static composeStringQuery(params?: RouteParams) {
		let paramsAsString = '';

		if (params)
			paramsAsString = Object.keys(params).reduce((toRet, key) => {
				let param = params[key];
				if (typeof param === 'function')
					param = param();

				return `${toRet}&${key}=${param}`;
			}, paramsAsString);

		if (paramsAsString.length > 0)
			paramsAsString = `?${paramsAsString.substring(1)}`;

		return paramsAsString;
	}
}

const activeStyle = {color: 'blue'};

export const defaultNavLinkNode = (route: RoutePath): React.ReactElement => {
	return <NavLink key={route.key} to={route.path} activeStyle={activeStyle}>{route.label}</NavLink>;
};

export const defaultLinkNode = (route: RoutePath, node?: React.ReactNode): React.ReactElement => {
	return <Link key={route.key} to={route.path}>{node || route.label || route.key}</Link>;
};

export const defaultRouteNode = (route: RoutePath): React.ReactElement => {
	if (typeof route.component === 'string')
		return <ReactEntryComponentInjector src={route.component}/>;

	return <Route exact={route.exact} key={route.key} path={route.path} component={route.component}/>;
};