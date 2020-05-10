import * as React from 'react';
import {
	CSSProperties,
	ReactNode
} from 'react';

export class Tab {

	public title: string;
	public content: ReactNode;

	constructor(title: string, content: ReactNode) {
		this.title = title;
		this.content = content;
	}

}

type Props = {
	selectedStyle: CSSProperties
	nonSelectedStyle: CSSProperties
	tabs: Tab[]
}

type State = {
	selectedTab: Tab
}

export class Tabs
	extends React.Component<Props, State> {

	constructor(props: Props) {
		super(props);
		this.state = {
			selectedTab: this.props.tabs[0]
		}
	}

	render() {
		return <div>
			<div className={'ll_h_c'} style={{height: 28, justifyContent: "center"}}>
				{this.props.tabs.map(this.renderTabHandle)}
			</div>
			{this.state.selectedTab.content}
		</div>;
	}

	renderTabHandle = (tab: Tab, key: number) => {
		const selected = tab === this.state.selectedTab;
		const style = selected ? this.props.selectedStyle : this.props.nonSelectedStyle;
		return <div key={key} style={{paddingLeft: 10, paddingRight: 10}}>
			<span className={`clickable`} onClick={() => this.setState({selectedTab: tab})} style={style}>
				{tab.title}
			</span>
		</div>
	}

}
