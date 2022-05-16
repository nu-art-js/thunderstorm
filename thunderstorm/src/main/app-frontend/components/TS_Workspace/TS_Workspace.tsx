/*	QWorkspaceVertical	- content display and resizing
*	When given panel contents and a page, displays content in resizable panels.*/
import {compare} from '@nu-art/ts-common';
import * as React from 'react';
import {ComponentAsync} from '../../core/ComponentAsync';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_Workspace.scss';
import {PanelConfig, Props_WorkspacePanel, Config_PanelParent, State_WorkspacePanel} from './types';


export abstract class PanelBaseSync<Config, State = {}, Props = {}>
	extends ComponentSync<Props_WorkspacePanel<Config, Props> & Props, State_WorkspacePanel<Config, State>> {

	protected deriveStateFromProps(nextProps: Props_WorkspacePanel<Config, Props>): State_WorkspacePanel<Config, State> {
		return {config: {...nextProps.config}} as State_WorkspacePanel<Config, State>;
	}

	shouldComponentUpdate(nextProps: Readonly<Props_WorkspacePanel<Config, Props>>, nextState: Readonly<State_WorkspacePanel<Config, State>>, nextContext: any): boolean {
		if (super.shouldComponentUpdate(nextProps, nextState, nextContext))
			return true;

		return !compare(nextState.config, nextProps.config as Config);
	}
}

export abstract class PanelBaseAsync<Config, State = {}, Props = {}>
	extends ComponentAsync<Props_WorkspacePanel<Config, Props>, State_WorkspacePanel<Config, State>> {

	protected async deriveStateFromProps(nextProps: Props_WorkspacePanel<Config, Props>): Promise<State_WorkspacePanel<Config, State>> {
		return {config: {...nextProps.config}} as State_WorkspacePanel<Config, State>;
	}

	shouldComponentUpdate(nextProps: Readonly<Props_WorkspacePanel<Config, Props>>, nextState: Readonly<State_WorkspacePanel<Config, State>>, nextContext: any): boolean {
		if (super.shouldComponentUpdate(nextProps, nextState, nextContext))
			return true;

		return !compare(nextState.config, nextProps.config as Config);
	}
}

export abstract class PanelParentSync<Config = {}, State = {}, Props = {}>
	extends PanelBaseSync<Config_PanelParent<Config>, State, Props> {

	renderPanel(panel: PanelConfig) {
		const PanelRenderer = this.props.renderers[panel.key];
		return <PanelRenderer config={panel.data} renderers={this.props.renderers} onConfigChanged={this.props.onConfigChanged}/>;
	}
}

export abstract class PanelParentAsync<Config = {}, State = {}, Props = {}>
	extends PanelBaseAsync<Config_PanelParent<Config>, State, Props> {

	renderPanel(panel: PanelConfig) {
		const PanelRenderer = this.props.renderers[panel.key];
		if (!PanelRenderer)
			return `NO RENDERER DEFINED FOR KEY: ${panel.key}`;
		return <PanelRenderer config={panel.data} renderers={this.props.renderers}/>;
	}
}

export class TS_Workspace
	extends PanelParentSync<Config_PanelParent> {
	static defaultProps = {
		onConfigChanged: () => {
		}
	};

	render() {
		const panels = this.props.config.panels;
		if (panels.length > 1 || panels.length === 0)
			return 'ROOT WORKSPACE MUST HAVE ONE AND ONLY ONE PANEL CONFIG';

		return <div className="ts-workspace">
			{this.renderPanel(panels[0])}
		</div>;
	}
}