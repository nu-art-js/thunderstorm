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
import {md5, sortArray, ThisShouldNotHappenException, TypedMap} from '@nu-art/ts-common';
import {Outlet} from 'react-router-dom';
import {TS_AppTools_Default} from './TS_AppTools_Default';
import {AppToolsScreen} from './types';
import {TS_Icons} from '@nu-art/ts-styles';
import {TS_CollapsableContainer} from '../TS_CollapsableContainer';

type CollapseState = {
	navbarCollapse: boolean;
	groups: TypedMap<boolean>;
}

type ScreenGroup = {
	label: string;
	screens: AppToolsScreen[];
}

const noGroupLabel = 'Other';
const collapseStateStorage = new StorageKey<CollapseState>('app-tools-collapse-state');

type State = CollapseState;

export class TS_AppTools
	extends React.Component<{}, State> {

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
				...TS_AppTools.screens.map(screen => ({key: screen.key || screen.name, path: md5(screen.name), Component: screen.renderer})),
			]
		};
	}

	static renderPageHeader(title: string) {
		return <div className={'app-tools-page__page__header'}>{title}</div>;
	}

	// ######################### Life Cycle #########################

	constructor(props: {}) {
		super(props);
		const collapse = collapseStateStorage.get();
		this.state = {
			navbarCollapse: collapse?.navbarCollapse ?? false,
			groups: collapse?.groups ?? {},
		};
	}

	// ######################### Logic #########################

	private toggleGroupCollapse = (key: string) => {
		const collapse = {...this.state};
		collapse.groups[key] = !collapse.groups[key];
		this.setState(collapse);
		collapseStateStorage.set(collapse);
	};

	private toggleNavBarCollapse = () => {
		const collapse = {...this.state};
		collapse.navbarCollapse = !collapse.navbarCollapse;
		this.setState(collapse);
		collapseStateStorage.set(collapse);
	};

	private groupsSort = (g1: ScreenGroup, g2: ScreenGroup): number => {
		if (g1.label === noGroupLabel)
			return 1;
		if (g2.label === noGroupLabel)
			return -1;
		return g1.label > g2.label ? -1 : 1;
	};

	private groupScreens = (screens: AppToolsScreen[]): ScreenGroup[] => {
		let groups = screens.reduce<ScreenGroup[]>((acc, curr) => {
			if (!curr.group) {
				acc[0].screens.push(curr);
				return acc;
			}

			let index = acc.findIndex(i => i.label === curr.group);
			if (index < 0) {
				acc.push({label: curr.group, screens: []});
				index = acc.length - 1;
			}
			acc[index].screens.push(curr);
			return acc;
		}, [{label: noGroupLabel, screens: []}]);

		groups = groups.sort(this.groupsSort);
		return groups;
	};

	// ######################### Render #########################

	private renderHeader = () => {
		return <LL_H_C className={'ts-app-tools__header'}>
			<TS_Icons.menu.component
				className={'ts-app-tools__header__caret'}
				onClick={this.toggleNavBarCollapse}
			/>
			<span className={'ts-app-tools__header__title'}>App-Tools</span>
		</LL_H_C>;
	};

	private renderNavbarItem = (screen: AppToolsScreen) => {
		const route = TS_AppTools.Route.children!.find(i => i.key === screen.key);
		if (!route)
			throw new ThisShouldNotHappenException(`Couldn't find route for screen with key ${screen.name}`);

		const Icon = screen.icon ?? TS_Icons.gear.component;
		return <TS_NavLink
			key={screen.key}
			route={route}
			className={({isActive}) => _className('ts-app-tools__nav-bar__item', isActive ? 'selected' : undefined)}
		>
			<Icon/>
			<div className={'ts-app-tools__nav-bar__item__title'}>{screen.name}</div>
		</TS_NavLink>;
	};

	private renderNavbar = () => {
		const screens = sortArray(TS_AppTools.screens, i => i.name);
		const groups = this.groupScreens(screens);
		const className = _className('ts-app-tools__nav-bar', this.state.navbarCollapse ? 'ts-app-tools__nav-bar-collapsed' : undefined);

		if (groups.length === 1) {
			return <LL_V_L className={className}>
				{screens.map(this.renderNavbarItem)}
			</LL_V_L>;
		}

		return <LL_V_L className={className}>
			{groups.map(group => {
				return <TS_CollapsableContainer
					key={group.label}
					headerRenderer={group.label}
					containerRenderer={group.screens.map(this.renderNavbarItem)}
					customCaret={<TS_Icons.treeCollapse.component/>}
					flipHeaderOrder={true}
					onCollapseToggle={() => this.toggleGroupCollapse(group.label)}
					collapsed={this.state.groups[group.label]}
				/>;
			})}
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