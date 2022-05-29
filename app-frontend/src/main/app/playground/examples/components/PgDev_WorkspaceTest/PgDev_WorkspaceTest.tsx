import {
	ComponentSync,
	PanelConfig,
	SimpleListAdapter,
	TS_DropDown,
	TS_HorizontalWorkspace,
	TS_VerticalWorkspace,
	TS_Workspace
} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';

const leftPanel = (props: {}) => <div
	style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', background: '#ffccbb'}}>Left
	Panel</div>;
const rightPanel = (props: {}) => <div
	style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', background: '#add8e6'}}>Right
	Panel</div>;
const centerPanel = (props: {}) => <div
	style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', background: '#90ee90'}}>Middle
	Panel</div>;
const bottomPanel = (props: {}) => <div
	style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', background: '#ffccbb'}}>Bottom
	Panel</div>;
const topPanel = (props: {}) => <div
	style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', background: '#add8e6'}}>
	Top Panel</div>;

const panelRenderers: { [k: string]: React.ElementType } = {
	horizontalSpace: TS_HorizontalWorkspace,
	verticalSpace: TS_VerticalWorkspace,
	leftPanel: leftPanel,
	centerPanel: centerPanel,
	rightPanel: rightPanel,
	topPanel: topPanel,
	bottomPanel: bottomPanel,
};

const LeftPanelOnlyWorkspace: PanelConfig<'leftPanel'> = {name: 'LeftPanelOnlyWorkspace', key: 'leftPanel', visible: true, factor: 1, min: 200};
const HorizontalWithLeftAndRightPanelsOnlyWorkspace: PanelConfig<'horizontalSpace'> = {
	name: 'LL_H_L&R - V1',
	key: 'horizontalSpace',
	visible: true,
	factor: 1,
	min: -1,
	data: {
		panels: [
			{name: 'LeftPanel', key: 'leftPanel', visible: true, factor: 0.5, min: 200},
			{name: 'RightPanel', key: 'rightPanel', visible: true, factor: 0.5, min: 200}]
	}
};
const HorizontalWithLeftAndRightPanelsOnlyWorkspace2: PanelConfig<'horizontalSpace'> = {
	name: 'LL_H_L&R - V2',
	key: 'horizontalSpace',
	visible: true,
	factor: 1,
	min: -1,
	data: {
		panels: [
			{
				name: 'LeftPanel',
				key: 'verticalSpace',
				visible: true,
				factor: 0.5,
				min: 200,
				data: {
					panels: [{name: 'TopPanel', key: 'topPanel', visible: true, factor: 0.5, min: 200},
						{name: 'BottomPanel', key: 'bottomPanel', visible: true, factor: 0.5, min: 200}]
				}
			},
			{name: 'RightPanel', key: 'rightPanel', visible: true, factor: 0.5, min: 200}]
	}
};
const Horizontal3EqualPanels: PanelConfig<'horizontalSpace'> = {
	name: 'LL_H_L&C&R',
	key: 'horizontalSpace',
	visible: true,
	factor: 1,
	min: -1,
	data: {
		panels: [
			{name: 'LeftPanel', key: 'leftPanel', visible: true, factor: 1 / 3, min: 200},
			{name: 'centerPanel', key: 'centerPanel', visible: true, factor: 1 / 3, min: 200},
			{name: 'RightPanel', key: 'rightPanel', visible: true, factor: 1 / 3, min: 200},
		]
	}
};
const Vertical3EqualPanels: PanelConfig<'verticalSpace'> = {
	name: 'LL_V_L&C&R',
	key: 'verticalSpace',
	visible: true,
	factor: 1,
	min: -1,
	data: {
		panels: [
			{name: 'TopPanel', key: 'topPanel', visible: true, factor: 1 / 3, min: 200},
			{name: 'centerPanel', key: 'centerPanel', visible: true, factor: 1 / 3, min: 200},
			{name: 'BottomPanel', key: 'bottomPanel', visible: true, factor: 1 / 3, min: 200},
		]
	}
};

const configs = [
	Horizontal3EqualPanels,
	Vertical3EqualPanels,
	LeftPanelOnlyWorkspace,
	HorizontalWithLeftAndRightPanelsOnlyWorkspace,
	HorizontalWithLeftAndRightPanelsOnlyWorkspace2,
];

type Props = {};

type State = {
	workspace: PanelConfig<any>;
};

class WorkspaceTest
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: any): State {
		return {
			workspace: this.state?.workspace || configs[0]
		};
	}

	render() {
		return <div style={{width: '90vw', height: '85vh'}}>
			<TS_Workspace
				config={{panels: [this.state.workspace]}}
				renderers={panelRenderers}
			/>
			<div style={{position: 'absolute', top: '100px', left: '20px'}}>
				<div onClick={() => {
					this.reDeriveState();
				}}>Reset Layout Config
				</div>
				<TS_DropDown
					adapter={SimpleListAdapter(configs, node => <div>{node.item.name}</div>)}
					onSelected={(item) => {
						this.setState({workspace:item});
						this.forceUpdate();
					}}/>
			</div>
		</div>;
	}
};

export const PgDev_WorkspaceTest = {name: 'Workspace Test', renderer: WorkspaceTest};