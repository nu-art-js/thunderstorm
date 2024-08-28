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
import {ModuleFE_Routing} from '@thunder-storm/core/frontend';
import {Page_Home} from '../pages/Page_Home';
import {Page_ApiGen} from '../pages/Page_ApiGen';
import {Example_Dialogs} from '../playground/examples/modules/Example_Dialogs';
import {Example_Toaster} from '../playground/examples/modules/Example_Toaster';
import {Example_Dispatch} from '../playground/examples/Example_Dispatch';
import {Component_Login} from '@thunder-storm/user-account/frontend';

export const Route_ApiGen = 'api-generation';
export const Route_Dialog = 'dialog';
export const Route_Toaster = 'toaster';
export const Route_Login = 'login';
export const Route_Home = 'home';
export const Route_Dispatch = 'test';

const PageLinkKeys = [
	Route_Home,
	Route_Login,
	Route_Dialog,
	Route_Toaster,
	Route_Dispatch,
	Route_ApiGen,
];

export const registerRoutes = () => {
	ModuleFE_Routing.clearRoutes();
	ModuleFE_Routing.addRoute(Route_ApiGen, '/api-gen', Page_ApiGen.renderer).setLabel('Api Generator');
	ModuleFE_Routing.addRoute(Route_Dialog, '/dialog', Example_Dialogs.renderer).setLabel('Dialog Examples');
	ModuleFE_Routing.addRoute(Route_Toaster, '/toaster', Example_Toaster.renderer).setLabel('Toaster Examples');
	ModuleFE_Routing.addRoute(Route_Login, '/login', Component_Login).setLabel('Login');
	ModuleFE_Routing.addRoute(Route_Dispatch, '/dispatch', Example_Dispatch).setLabel('dispatch');
	ModuleFE_Routing.addRoute(Route_Home, '/', Page_Home).setLabel('Home').setExact(false);
};

let menuRef: HTMLDivElement;

export class NavigationBar
	extends React.Component {

	render() {
		registerRoutes();

		return <div className="ll_v_l">
			<div ref={(instance: HTMLDivElement) => {
				if (menuRef)
					return;

				menuRef = instance;
				this.forceUpdate();
			}}>
				<div className="menu">
					{ModuleFE_Routing.getNavLinks(PageLinkKeys)}
				</div>
			</div>


			{this.renderRoutes()}

		</div>;
	}

	renderRoutes = () => {
		if (!menuRef)
			return '';

		return <div style={{padding: menuRef.clientHeight}}>{ModuleFE_Routing.getRoutesMap()}</div>;
	};
}

