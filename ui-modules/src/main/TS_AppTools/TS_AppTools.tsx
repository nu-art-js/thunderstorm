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
import {LL_H_C, LL_V_L, TS_ErrorBoundary} from '@nu-art/thunder-widgets/v2';
import {TS_Route} from '@nu-art/thunder-routing';
import {md5, TypedMap} from '@nu-art/ts-common';
import {Outlet} from 'react-router';
import {TS_AppTools_Default} from './TS_AppTools_Default.js';
import {AppToolsScreen} from './types.js';
import {TS_Icons} from '@nu-art/ts-styles';
import {_className, StorageKey} from '@nu-art/thunder-core';
import {RegistryList, RegistryToolbar, routeForScreen} from './RegistryList.js';
import {rememberRecent, togglePinned, type RegistryGroupBy, type RegistryScope} from './registry-model.js';

type CollapseState = {
	navbarCollapse: boolean;
};
type RegistryPrefs = {
	pinned: string[];
	recent: string[];
	collapsed: TypedMap<boolean>;
	groupBy: RegistryGroupBy;
};
const collapseStateStorage = new StorageKey<CollapseState>('app-tools-collapse-state');
const registryStorage = new StorageKey<RegistryPrefs>('app-tools-registry');
type State = CollapseState & RegistryPrefs & {
	query: string;
	scope: RegistryScope;
};

export class TS_AppTools
	extends React.Component<{}, State> {
	// ######################### Static #########################
	static Route: TS_Route;
	static screens: AppToolsScreen[];
	static headerTail?: () => React.ReactNode;
	static onMountCallback?: () => void;

	static createRoute(screens: AppToolsScreen[], path = 'app-tools', headerTail?: () => React.ReactNode, onMountCallback?: () => void): TS_Route {
		this.screens = screens;
		this.headerTail = headerTail;
		this.onMountCallback = onMountCallback;
		return this.Route = {
			path,
			key: 'app-tools',
			Component: this,
			children: [
				TS_AppTools_Default.Route,
				...TS_AppTools.screens.map(screen => {
					return ({
						key: screen.key || (screen.key = screen.name),
						path: md5(screen.name),
						Component: screen.renderer,
						modulesToAwait: screen.modulesToAwait,
						children: screen.children
					});
				}),
			]
		};
	}

	static renderPageHeader(title: string) {
		return <div className={'app-tools-page__page__header'}>{title}</div>;
	}

	private readonly searchRef = React.createRef<HTMLInputElement>();

	// ######################### Life Cycle #########################
	constructor(props: {}) {
		super(props);
		const collapse = collapseStateStorage.get();
		const registry = registryStorage.get();
		this.state = {
			navbarCollapse: collapse?.navbarCollapse ?? false,
			query: '',
			scope: 'all',
			groupBy: registry?.groupBy ?? 'category',
			pinned: registry?.pinned ?? [],
			recent: registry?.recent ?? [],
			collapsed: registry?.collapsed ?? {},
		};
	}

	componentDidMount() {
		window.addEventListener('keydown', this.onSearchKey);
		TS_AppTools.onMountCallback?.();
	}

	componentWillUnmount() {
		window.removeEventListener('keydown', this.onSearchKey);
	}

	// ######################### Logic #########################
	private onSearchKey = (event: KeyboardEvent) => {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			this.searchRef.current?.focus();
		}
	};
	private saveRegistry = (next: RegistryPrefs) => {
		registryStorage.set(next);
	};
	private toggleNavBarCollapse = () => {
		const navbarCollapse = !this.state.navbarCollapse;
		this.setState({navbarCollapse});
		collapseStateStorage.set({navbarCollapse});
	};
	private setQuery = (query: string) => {
		this.setState({query});
	};
	private setScope = (scope: RegistryScope) => {
		this.setState({scope});
	};
	private setGroupBy = (groupBy: RegistryGroupBy) => {
		const next = {pinned: this.state.pinned, recent: this.state.recent, collapsed: this.state.collapsed, groupBy};
		this.setState(next);
		this.saveRegistry(next);
	};
	private toggleGroup = (name: string) => {
		const collapsed = {...this.state.collapsed, [name]: !this.state.collapsed[name]};
		const next = {pinned: this.state.pinned, recent: this.state.recent, collapsed, groupBy: this.state.groupBy};
		this.setState(next);
		this.saveRegistry(next);
	};
	private togglePin = (key: string) => {
		const next = {pinned: togglePinned(this.state.pinned, key), recent: this.state.recent, collapsed: this.state.collapsed, groupBy: this.state.groupBy};
		this.setState(next);
		this.saveRegistry(next);
	};
	private openScreen = (key: string) => {
		const next = {pinned: this.state.pinned, recent: rememberRecent(this.state.recent, key), collapsed: this.state.collapsed, groupBy: this.state.groupBy};
		this.setState(next);
		this.saveRegistry(next);
	};
	private routeFor = (key: string) => routeForScreen(TS_AppTools.Route.children, key);

	// ######################### Render #########################
	render() {
		return <LL_V_L className={'ts-app-tools'}>
			{this.renderHeader()}
			<LL_H_C className={'ts-app-tools__main'}>
				{this.renderNavbar()}
				<TS_ErrorBoundary>
					{this.renderPage()}
				</TS_ErrorBoundary>
			</LL_H_C>
		</LL_V_L>;
	}

	private renderHeader = () => {
		return <LL_H_C className={'ts-app-tools__header'}>
			<TS_Icons.menu.component className={'ts-app-tools__header__caret'} onClick={this.toggleNavBarCollapse}/>
			<span className={'ts-app-tools__header__title'}>Dev Tools</span>
			{TS_AppTools.headerTail && TS_AppTools.headerTail()}
		</LL_H_C>;
	};
	private renderNavbar = () => {
		const className = _className('ts-app-tools__nav-bar', this.state.navbarCollapse ? 'ts-app-tools__nav-bar-collapsed' : undefined);
		return <LL_V_L className={className}>
			<RegistryList
				screens={TS_AppTools.screens}
				query={this.state.query}
				scope={this.state.scope}
				groupBy={this.state.groupBy}
				pinned={this.state.pinned}
				recent={this.state.recent}
				collapsed={this.state.collapsed}
				searchRef={this.searchRef}
				onQuery={this.setQuery}
				onScope={this.setScope}
				onGroupBy={this.setGroupBy}
				onToggleGroup={this.toggleGroup}
				onTogglePin={this.togglePin}
				onOpen={this.openScreen}
				routeFor={this.routeFor}
			/>
		</LL_V_L>;
	};
	private renderPage = () => {
		return <div className="ts-app-tools__page">
			<RegistryToolbar screens={TS_AppTools.screens} pinned={this.state.pinned} onTogglePin={this.togglePin} routeFor={this.routeFor}/>
			<Outlet/>
		</div>;
	};
}
