/*
 * A typescript & react boilerplate with api call example
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
import {ModuleFE_RoutingV2, TS_NavLink, TS_Route} from '@nu-art/thunderstorm-frontend';
import {Page_Home} from '../pages/Page_Home.js';
import {Page_ApiGen} from '../pages/Page_ApiGen.js';
import {Example_Dialogs} from '../playground/examples/modules/Example_Dialogs.js';
import {Example_Toaster} from '../playground/examples/modules/Example_Toaster.js';
import {Example_Dispatch} from '../playground/examples/Example_Dispatch.js';
import {Component_Login} from '@nu-art/user-account-frontend/index';

export const Route_ApiGen = 'api-generation';
export const Route_Dialog = 'dialog';
export const Route_Toaster = 'toaster';
export const Route_Login = 'login';
export const Route_Home = 'home';
export const Route_Dispatch = 'test';

export const Route_ApiGen_Def: TS_Route = {
	key: Route_ApiGen,
	path: 'api-gen',
	Component: Page_ApiGen.renderer,
};

export const Route_Dialog_Def: TS_Route = {
	key: Route_Dialog,
	path: 'dialog',
	Component: Example_Dialogs.renderer,
};

export const Route_Toaster_Def: TS_Route = {
	key: Route_Toaster,
	path: 'toaster',
	Component: Example_Toaster.renderer,
};

export const Route_Login_Def: TS_Route = {
	key: Route_Login,
	path: 'login',
	Component: Component_Login,
};

export const Route_Dispatch_Def: TS_Route = {
	key: Route_Dispatch,
	path: 'dispatch',
	Component: Example_Dispatch,
};

export const Route_Home_Def: TS_Route = {
	key: Route_Home,
	path: '/',
	Component: Page_Home,
	fallback: true,
};

export const Route_Root: TS_Route = {
	key: 'root',
	path: '/',
	Component: Page_Home, // Root component is the home page
	fallback: true,
	children: [
		Route_ApiGen_Def,
		Route_Dialog_Def,
		Route_Toaster_Def,
		Route_Login_Def,
		Route_Dispatch_Def,
	],
};

const PageLinkRoutes: Array<{route: TS_Route, label: string}> = [
	{route: Route_Home_Def, label: 'Home'},
	{route: Route_Login_Def, label: 'Login'},
	{route: Route_Dialog_Def, label: 'Dialog Examples'},
	{route: Route_Toaster_Def, label: 'Toaster Examples'},
	{route: Route_Dispatch_Def, label: 'dispatch'},
	{route: Route_ApiGen_Def, label: 'Api Generator'},
];

let menuRef: HTMLDivElement;

export class NavigationBar
	extends React.Component {

	render() {
		return <div className="ll_v_l">
			<div ref={(instance: HTMLDivElement) => {
				if (menuRef)
					return;

				menuRef = instance;
				this.forceUpdate();
			}}>
				<div className="menu">
					{PageLinkRoutes.map(({route, label}) => (
						<TS_NavLink key={route.key} route={route}>
							{label}
						</TS_NavLink>
					))}
				</div>
			</div>


			{this.renderRoutes()}

		</div>;
	}

	renderRoutes = () => {
		if (!menuRef)
			return '';

		return <div style={{padding: menuRef.clientHeight}}>{ModuleFE_RoutingV2.generateRoutes(Route_Root)}</div>;
	};
}

