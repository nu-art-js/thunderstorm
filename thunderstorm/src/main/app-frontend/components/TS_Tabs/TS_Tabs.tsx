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


export type TabContent = React.ReactNode | (() => React.ReactNode);
export type TabTitle = TabContent | string;
export type _Tab = { title: TabTitle, content: TabContent };
export type Tab = _Tab & { uid: string };
export type Props_Tabs = {
	selectedTabUid?: string
	tabs: Tab[]
	tabsHeaderClass?: string;
	/**
	 * Called only after clicking on a tab. Not called when a default first tab is selected during render.
	 * @param selected id of the selected tab.
	 */
	onSelected?: (selectedTabId: string) => void
}

type TabToRender = { [K in keyof _Tab]: React.ReactNode } & { uid: string };
type State = {
	tabs: TabToRender[]
	focused?: string
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
 *     .ts-tabs__focused {}
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

	protected deriveStateFromProps(nextProps: Props_Tabs): State {
		return {
			tabs: nextProps.tabs,
			focused: (nextProps.tabs.find(t => t.uid === this.props.selectedTabUid)?.uid) || this.state?.focused || nextProps.tabs[0]?.uid
		};
	}

	selectOnClick = (e: React.MouseEvent) => {
		stopPropagation(e);
		const tabUid = e.currentTarget?.id;
		if (!tabUid)
			return;

		this.setState({focused: tabUid});
		this.props.onSelected?.(tabUid);
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

		return (
			<div className="ts-tabs">
				<div className={headerClass}>
					{tabs.map(tab => {
						const tabClasses = _className('ts-tabs__tab', 'unselectable', this.state.focused === tab.uid ? 'ts-tabs__focused' : undefined);
						return <div key={tab.uid} id={tab.uid} className={tabClasses} onClick={this.selectOnClick}>{getTitle(tab)}</div>;
					})}
				</div>
				<div className="ts-tabs__content">
					{getContent(tabs.find(tab => tab.uid === this.state.focused))}
				</div>
			</div>
		);
	}
}
