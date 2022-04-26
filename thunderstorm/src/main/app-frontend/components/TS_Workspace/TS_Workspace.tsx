/*	QWorkspaceVertical	- content display and resizing
*	When given panel contents and a page, displays content in resizable panels.*/
import {compare} from '@nu-art/ts-common';
import * as React from 'react';
import {BaseAsyncState, ComponentAsync} from '../../core/ComponentAsync';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_Workspace.scss';
import {PanelConfig, Props_BasePanel, Props_PanelParent} from './types';

type State_WorkspacePanel<State, Config> = BaseAsyncState & State & {
	config: Config
}

export abstract class PanelBaseSync<Config, State = {}, ExtraProps = {}>
	extends ComponentSync<Props_BasePanel<Config> & ExtraProps, State_WorkspacePanel<State, Config>> {

	protected deriveStateFromProps(nextProps: Props_BasePanel<Config>): State_WorkspacePanel<State, Config> {
		return {config: nextProps.config} as State_WorkspacePanel<State, Config>;
	}

	shouldComponentUpdate(nextProps: Readonly<Props_BasePanel<Config> & ExtraProps>, nextState: Readonly<State_WorkspacePanel<State, Config>>, nextContext: any): boolean {
		if (super.shouldComponentUpdate(nextProps, nextState, nextContext))
			return true;

		return !compare(nextState.config, nextProps.config as Config);
	}
}

export abstract class PanelBaseAsync<Config, State = {}, ExtraProps = {}>
	extends ComponentAsync<Props_BasePanel<Config> & ExtraProps, State_WorkspacePanel<State, Config>> {
	protected async deriveStateFromProps(nextProps: Props_BasePanel<Config>): Promise<State_WorkspacePanel<State, Config>> {
		return {config: nextProps.config} as State_WorkspacePanel<State, Config>;
	}

	shouldComponentUpdate(nextProps: Readonly<Props_BasePanel<Config> & ExtraProps>, nextState: Readonly<State_WorkspacePanel<State, Config>>, nextContext: any): boolean {
		if (super.shouldComponentUpdate(nextProps, nextState, nextContext))
			return true;

		return !compare(nextState.config, nextProps.config as Config);
	}
}

export abstract class PanelParentSync<Props = {}, State = {}, ExtraProps = {}>
	extends PanelBaseSync<Props & Props_PanelParent, State, ExtraProps> {

	renderPanel(panel: PanelConfig) {
		const PanelRenderer = this.props.renderers[panel.key];
		return <PanelRenderer config={panel.data} renderers={this.props.renderers} onConfigChanged={this.props.onConfigChanged}/>;
	}
}

export abstract class PanelParentAsync<Props = {}, State = {}, ExtraProps = {}>
	extends PanelBaseAsync<Props & Props_PanelParent, State, ExtraProps> {

	renderPanel(panel: PanelConfig) {
		const PanelRenderer = this.props.renderers[panel.key];
		if (!PanelRenderer)
			return `NO RENDERER DEFINED FOR KEY: ${panel.key}`;
		return <PanelRenderer config={panel.data} renderers={this.props.renderers}/>;
	}
}

export class TS_Workspace extends PanelParentSync<Props_PanelParent> {
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