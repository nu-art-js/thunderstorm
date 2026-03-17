import {WorkHubTab} from '@nu-art/work-hub-shared';
import {createRef} from 'react';
import {ModuleFE_WorkHub} from '../../_module/index.js';
import './Component_WorkHub_TabContent.scss';
import {ComponentSync, TS_ErrorBoundary} from '@nu-art/thunder-widgets';
import {WorkHubItem} from '../../_core/work-hub-item.js';
import {OnWorkHubTabs} from '../../dispatchers.js';
import {voidFunction} from '@nu-art/ts-common';

type Props = {
	tab: WorkHubTab;
}

type State = {
	tab: WorkHubTab;
	item: WorkHubItem<any>;
	renderArgs: any;
}

export class Component_WorkHub_TabContent
	extends ComponentSync<Props, State>
	implements OnWorkHubTabs {

	private ref = createRef<HTMLDivElement>();


	__onWorkHubTabsUpdated = () => {
		this.reDeriveState();
	};

	//We get the selected tab from the props, ignore updates here
	__onWorkHubTabSelected = voidFunction;

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.tab = nextProps.tab;
		state.item = ModuleFE_WorkHub.workHubItem.getByKey(state.tab.itemKey);
		state.renderArgs = {...state.tab.renderArgs};
		return state;
	}

	componentDidMount() {
		this.ref.current?.focus();
	}

	componentDidUpdate() {
		this.ref.current?.focus();
	}


	// Await-modules is up-level per user-account pattern (Component_AccountThumbnail); no AwaitModules wrapper here.
	render() {
		const item = this.state.item;
		const tab = this.state.tab;
		return <div className={'c__work-hub-tab-content'} ref={this.ref} tabIndex={0}>
			<TS_ErrorBoundary>
				{item.renderer(item, tab.id, this.state.renderArgs)}
			</TS_ErrorBoundary>
		</div>;
	}
}