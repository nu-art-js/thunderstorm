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
import './TS_AppTools.scss';
import {LL_H_C, LL_V_L} from '../Layouts';
import {StorageKey} from '../../modules/ModuleFE_LocalStorage';
import {_className} from '../../utils/tools';
import {TS_ErrorBoundary} from '../TS_ErrorBoundary';
import {TS_Route} from '../../modules/routing/types';
import {TS_NavLink} from '../../modules/routing/ModuleFE_RoutingV2';
import {md5, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {Outlet} from 'react-router-dom';
import {TS_AppTools_Default} from './TS_AppTools_Default';
import {AppToolsScreen} from './types';
import {TS_Icons} from '@nu-art/ts-styles';

const collapsedPlaygroundStorage = new StorageKey<boolean>('collapsed-playground');

export type PlaygroundProps = {}

type State = {
	navbarCollapse: boolean;
}

export class TS_AppTools
	extends React.Component<PlaygroundProps, State> {

	// ######################### Static #########################

	static Route: TS_Route;
	static screens: AppToolsScreen[];

	static createRoute(screens: AppToolsScreen[]): TS_Route {
		this.screens = screens;

		return this.Route = {
			path: 'app-tools',
			key: 'app-tools',
			Component: this,
			children: [
				TS_AppTools_Default.Route,
				...TS_AppTools.screens.map(screen => ({key: screen.key, path: md5(screen.name), Component: screen.renderer as React.ComponentClass})),
			]
		};
	}

	static renderPageHeader(title: string) {
		return <div className={'app-tools-page__page__header'}>{title}</div>;
	}

	// ######################### Life Cycle #########################

	constructor(props: PlaygroundProps) {
		super(props);
		this.state = {
			navbarCollapse: collapsedPlaygroundStorage.get() ?? false,
		};
	}

	// ######################### Logic #########################

	private toggleNavbarCollapse = () => {
		const navbarCollapse = !this.state.navbarCollapse;
		collapsedPlaygroundStorage.set(navbarCollapse);
		this.setState({navbarCollapse});
	};

	// ######################### Render #########################

	private renderHeader = () => {
		return <LL_H_C className={'ts-app-tools__header'}>
			<TS_Icons.menu.component
				className={'ts-app-tools__header__caret'}
				onClick={this.toggleNavbarCollapse}
			/>
			<span className={'ts-app-tools__header__title'}>App-Tools</span>
		</LL_H_C>;
	};

	private renderNavbarItem = (screen: AppToolsScreen) => {
		const route = TS_AppTools.Route.children!.find(i => i.key === screen.key);
		if (!route)
			throw new ThisShouldNotHappenException(`Couldn't find route for screen with key ${screen.key}`);

		return <TS_NavLink
			route={route}
			className={({isActive, isPending}) => _className('ts-app-tools__nav-bar__item', isActive ? 'selected' : undefined)}
		>{screen.name}</TS_NavLink>;
	};

	private renderNavbar = () => {
		const devScreens = TS_AppTools.screens.filter(screen => screen.type === 'dev');
		const pgScreens = TS_AppTools.screens.filter(screen => screen.type === 'playground');

		const className = _className('ts-app-tools__nav-bar', this.state.navbarCollapse ? 'ts-app-tools__nav-bar-collapsed' : undefined);
		return <LL_V_L className={className}>
			<div className={'ts-app-tools__nav-bar__header'}>Dev Pages</div>
			<nav>{devScreens.map(this.renderNavbarItem)}</nav>
			<div className={'ts-app-tools__nav-bar__header'}>Playground Pages</div>
			<nav>{pgScreens.map(this.renderNavbarItem)}</nav>
		</LL_V_L>;
	};

	render() {
		return <LL_V_L className={'ts-app-tools'}>
			{this.renderHeader()}
			<LL_H_C className={'ts-app-tools__main'}>
				{this.renderNavbar()}
				<TS_ErrorBoundary>
					<div className="ts-app-tools__page"><Outlet/></div>
				</TS_ErrorBoundary>
			</LL_H_C>
		</LL_V_L>;
	}
}
