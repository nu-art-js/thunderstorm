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
import {ComponentSync} from '../../core/ComponentSync';
import {_className, stopPropagation} from '../../utils/tools';
import './TS_Tabs.scss';
import {StorageKey} from '../../modules/ModuleFE_LocalStorage';


export type TabContent = React.ReactNode | (() => React.ReactNode);
export type TabTitle = TabContent | string;
export type _Tab = { title: TabTitle, content: TabContent };
export type Tab = _Tab & { uid: string };
export type Props_Tabs = {
	id?: string
	persistSelection?: boolean
	selectedTabId?: string
	tabs: Tab[]
	tabsHeaderClass?: string;
	tabsContentClass?: string;
	/**
	 * Called only after clicking on a tab. Not called when a default first tab is selected during render.
	 * @param selected id of the selected tab.
	 */
	onSelected?: (selectedTabId: string) => void
}

type TabToRender = { [K in keyof _Tab]: React.ReactNode } & { uid: string };
type State = {
	tabs: TabToRender[]
	selectedTabId?: string
}

/**
 * Tabs made easy
 *
 *
 * <b>SCSS:</b>
 * ```scss
 * .ts-tabs {
 *   .ts-tabs__tabs-header {
 *     .ts-tabs__tab {}
 *     .ts-tabs__focusedTabId {}
 *     .unselectable {}
 *   }
 *
 *   .ts-tabs__content {}
 * }
 * ```
 */
export class TS_Tabs
	extends ComponentSync<Props_Tabs, State> {

	constructor(p: Props_Tabs) {
		super(p);
	}

	private getStorageKey() {
		if (!this.props.id)
			return;

		return new StorageKey<string>(`ts-tabs__${this.props.id}`, this.props.persistSelection);
	}

	protected deriveStateFromProps(nextProps: Props_Tabs): State {
		const selectedTabId = (nextProps.tabs.find(t => t.uid === nextProps.selectedTabId)?.uid)
			|| this.getStorageKey()?.get('')
			|| this.state?.selectedTabId
			|| nextProps.tabs[0]?.uid;

		return {
			tabs: nextProps.tabs,
			selectedTabId
		};
	}

	selectOnClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, uid: string) => {
		stopPropagation(e);
		const selectedTabId = uid;
		if (!selectedTabId)
			return;

		this.getStorageKey()?.set(selectedTabId);
		if (this.props.onSelected) {
			this.props.onSelected(selectedTabId);
			return;
		}
		this.setState({selectedTabId});
	};

	render() {
		const tabs = this.state.tabs;
		if (!tabs)
			return '';

		const getTitle = (tab: Tab) => {
			if (typeof tab.title === 'function')
				return tab.title();

			return tab.title;
		};

		const getContent = (tab?: Tab) => {
			if (!tab)
				return '';

			if (typeof tab.content === 'function')
				return tab.content();

			return tab.content;
		};

		const headerClass = _className('ts-tabs__tabs-header', this.props.tabsHeaderClass);
		const contentClass = _className('ts-tabs__content', this.props.tabsContentClass);

		return (
			<div id={this.props.id} className="ts-tabs">
				<div className={headerClass}>
					{tabs.map(tab => {
						const tabClasses = _className('ts-tabs__tab', 'unselectable', this.state.selectedTabId === tab.uid ? 'ts-tabs__focused' : undefined);
						return <div key={tab.uid} id={tab.uid} className={tabClasses} onClick={(e) => this.selectOnClick(e, tab.uid)}>{getTitle(tab)}</div>;
					})}
				</div>
				<div className={contentClass}>
					{getContent(tabs.find(tab => tab.uid === this.state.selectedTabId))}
				</div>
			</div>
		);
	}

}
