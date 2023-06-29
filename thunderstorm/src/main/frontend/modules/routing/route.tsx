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

import {composeUrl, RouteParams} from '@nu-art/ts-common';
import * as React from 'react';
import {Link, NavLink, Route} from 'react-router-dom';
import {ReactEntryComponentInjector} from '../component-loader/ReactEntryComponentInjector';


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
		return composeUrl(this.path, params);
	}

}

const getNavStyles = (props: { isActive: boolean; isPending: boolean; }): React.CSSProperties => {
	return {
		color: props.isActive ? 'blue' : undefined,
	};
};

export const defaultNavLinkNode = (route: RoutePath): React.ReactElement => {
	return <NavLink key={route.key} to={route.path} style={getNavStyles}>{route.label as string}</NavLink>;
};

export const defaultLinkNode = (route: RoutePath, node?: React.ReactNode): React.ReactElement => {
	return <Link key={route.key} to={route.path}>{node || route.label as string || route.key}</Link>;
};

export const defaultRouteNode = (route: RoutePath): React.ReactElement => {
	if (typeof route.component === 'string')
		return <ReactEntryComponentInjector src={route.component}/>;

	const Component = route.component;
	return <Route key={route.key} path={route.path} element={<Component/>}/>;
};