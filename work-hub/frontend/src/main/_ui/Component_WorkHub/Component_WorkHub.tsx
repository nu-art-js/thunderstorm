import {ComponentSync, LL_V_L} from "@nu-art/thunder-routing";
import './Component_WorkHub.scss';
import {WorkHubTab} from '@nu-art/work-hub-shared';
import {ModuleFE_WorkHub} from '../../_module/index.js';
import {Component_WorkHub_Header} from '../Component_WorkHub_Header/Component_WorkHub_Header.js';
import {OnWorkHubTabs} from '../../dispatchers.js';
import {Component_WorkHub_TabContent} from '../Component_WorkHub_TabContent/Component_WorkHub_TabContent.js';
import {BadImplementationException} from '@nu-art/ts-common';

export type WorkHubHeaderConfig = {};

type Props = {
	noTabsMessage: string;
	headerConfig?: WorkHubHeaderConfig;
}

type State = {
	noTabsMessage: string;
	tabs: WorkHubTab[];
	headerConfig?: WorkHubHeaderConfig;
}

export class Component_WorkHub
	extends ComponentSync<Props, State>
	implements OnWorkHubTabs {

	//######################### Life Cycle #########################

	__onWorkHubTabsUpdated = () => {
		this.setState({
			tabs: ModuleFE_WorkHub.tabs.get(),
		});
	};

	__onWorkHubTabSelected = () => {
		this.forceUpdate();
	};

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.noTabsMessage = nextProps.noTabsMessage;
		state.tabs = ModuleFE_WorkHub.tabs.get();
		return state;
	}

	//######################### Render #########################

	render() {
		return <LL_V_L className={'c__work-hub'}>
			{this.render_Content()}
		</LL_V_L>;
	}

	private render_Content = () => {
		if (!this.state.tabs.length)
			return <div className={'c__work-hub__no-tabs-message'}>{this.state.noTabsMessage}</div>;

		const selectedTab = ModuleFE_WorkHub.tabs.getSelected();
		if (!selectedTab)
			throw new BadImplementationException('Has tabs but no selected tab!');

		return <>
			<Component_WorkHub_Header tabs={this.state.tabs} selectedTabId={selectedTab.id}/>
			<Component_WorkHub_TabContent tab={selectedTab}/>
		</>;
	};
}