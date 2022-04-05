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
import {BrowserHistoryModule} from '../../modules/HistoryModule';
import {_className, stopPropagation} from '../../utils/tools';
import './TS_Tabs.scss';


export type TabContent = React.ReactNode | (() => React.ReactNode);
export type TabTitle = TabContent | string;
export type _Tab = { title: TabTitle, content: TabContent };
export type Tab = _Tab & { uid: string };
export type Props_Tabs = {
	id?: string
	tabs: Tab[]
	containerStyle?: React.CSSProperties
	tabStyle?: React.CSSProperties
	tabsHeaderStyle?: React.CSSProperties
	selectedTabStyle?: React.CSSProperties
	contentStyle?: React.CSSProperties
}

type TabToRender = { [K in keyof _Tab]: React.ReactNode } & { uid: string };
type State = {
	tabs: TabToRender[]
	focused?: string
}

const DefaultHeaderStyle = {width: 120, height: 20};
const ParamKey_SelectedTab = 'selected-tab';

export class TS_Tabs
	extends ComponentSync<Props_Tabs, State> {

	static defaultProps = {
		tabStylable: {style: DefaultHeaderStyle},
		selectedTabStylable: {style: {...DefaultHeaderStyle, fontWeight: 600}}
	};

	constructor(p: Props_Tabs) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props_Tabs): State {
		const selectedTab = ComponentSync.getQueryParameter(ParamKey_SelectedTab);

		return {
			tabs: nextProps.tabs,
			focused: (selectedTab && nextProps.tabs.find(t => t.uid === selectedTab)?.uid) || this.state?.focused || nextProps.tabs[0]?.uid
		};
	}


	selectOnClick = (e: React.MouseEvent) => {
		stopPropagation(e);
		const id = e.currentTarget?.id;
		if (!id)
			return;

		BrowserHistoryModule.addQueryParam(ParamKey_SelectedTab, id);
		this.setState({focused: id});
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

		return (
			<div className="ts-tabs" style={this.props.containerStyle}>
				<div className='ts-tabs__tabs-header' style={this.props.tabsHeaderStyle}>
					{tabs.map(tab => {
						const style = {...this.props.tabStyle, ...this.state.focused === tab.uid ? this.props.selectedTabStyle : undefined};
						const tabClasses = _className('ts-tabs__tab', this.state.focused === tab.uid ? 'ts-tabs__focused' : undefined);
						return <div key={tab.uid} id={tab.uid} className={tabClasses} style={style} onClick={this.selectOnClick}>{getTitle(tab)}</div>;
					})}
				</div>
				<div className='ts-tabs__content' style={this.props.contentStyle}>
					{getContent(tabs.find(tab => tab.uid === this.state.focused))}
				</div>
			</div>
		);
	}
}
