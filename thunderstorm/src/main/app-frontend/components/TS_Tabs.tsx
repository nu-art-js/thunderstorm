import * as React from 'react';
import {ReactNode} from 'react';
import {BaseComponent} from '../core/BaseComponent';
import {BrowserHistoryModule} from '../modules/HistoryModule';
import {Stylable} from '../tools/Stylable';
import {stopPropagation} from '../utils/tools';

export type TabContent = ReactNode | (() => ReactNode);
export type TabTitle = TabContent | string;
export type _Tab = { title: TabTitle, content: TabContent };
export type Tab = _Tab & { uid: string };
type Props = {
	id?: string
	tabs: Tab[]
	componentStylable?: Stylable
	headerStylable?: Stylable
	tabsHeaderStylable?: Stylable
	selectedHeaderStylable?: Stylable
	editorStylable?: Stylable
}

type TabToRender = { [K in keyof _Tab]: ReactNode } & { uid: string };
type State = {
	tabs: TabToRender[]
	focused?: string
}

const DefaultHeaderStyle = {width: 120, height: 20};
const ParamKey_SelectedTab = 'selected-tab';

export class TS_Tabs
	extends BaseComponent<Props, State> {

	static defaultProps = {
		headerStylable: {style: DefaultHeaderStyle},
		selectedHeaderStylable: {style: {...DefaultHeaderStyle, fontWeight: 600}}
	};

	protected deriveStateFromProps(nextProps: Props): State {
		const newTabs = nextProps.tabs.map((tab) => {
			let title;
			let content;

			if (typeof tab.title === 'function')
				title = tab.title();
			else if (typeof tab.title === 'string')
				title = tab.title;
			else
				title = tab.title;

			if (typeof tab.content === 'function')
				content = tab.content();
			else
				content = tab.content;

			return {
				uid: tab.uid,
				title: title,
				content
			};
		});

		const selectedTab = BaseComponent.getQueryParameter(ParamKey_SelectedTab);

		return {
			tabs: newTabs,
			focused: this.state.focused || (selectedTab && newTabs.find(t => t.uid === selectedTab)?.uid) || newTabs[0]?.uid
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

		return <div className={`ll_v_l ${this.props.componentStylable?.className}`} style={this.props.componentStylable?.style}>
			<div className={`ll_h_c ${this.props.tabsHeaderStylable?.className}`} style={this.props.tabsHeaderStylable?.style}>
				{tabs.map(tab => {
					const style = this.state.focused === tab.uid ? this.props.selectedHeaderStylable?.style : this.props.headerStylable?.style;
					return <div id={tab.uid} style={style} onClick={this.selectOnClick}>{tab.title}</div>;
				})}
			</div>
			<div className={this.props.editorStylable?.className} style={this.props.editorStylable?.style}>
				{tabs.find(tab => tab.uid === this.state.focused)?.content}
			</div>
		</div>;
	}
}
