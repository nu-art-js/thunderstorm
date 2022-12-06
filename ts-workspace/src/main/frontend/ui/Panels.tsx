import * as React from 'react';
import {Config_PanelParent, PanelConfig, Props_WorkspacePanel, State_WorkspacePanel} from './types';
import {ComponentAsync, ComponentSync} from '@nu-art/thunderstorm/frontend';
import {compare} from '@nu-art/ts-common';

export abstract class PanelBaseSync<Config, State = {}, Props = {}>
	extends ComponentSync<Props_WorkspacePanel<Config, Props> & Props, State_WorkspacePanel<Config, State>> {

	protected deriveStateFromProps(nextProps: Props_WorkspacePanel<Config, Props>): State_WorkspacePanel<Config, State> {
		return {config: {...nextProps.config}} as State_WorkspacePanel<Config, State>;
	}

	shouldReDeriveState(nextProps: Readonly<Props_WorkspacePanel<Config, Props>>): boolean {
		return !compare(this.state.config, nextProps.config as Config);
	}
}

export abstract class PanelBaseAsync<Config, State = {}, Props = {}>
	extends ComponentAsync<Props_WorkspacePanel<Config, Props>, State_WorkspacePanel<Config, State>> {

	protected async deriveStateFromProps(nextProps: Props_WorkspacePanel<Config, Props>): Promise<State_WorkspacePanel<Config, State>> {
		return {config: {...nextProps.config}} as State_WorkspacePanel<Config, State>;
	}

	shouldReDeriveState(nextProps: Readonly<Props_WorkspacePanel<Config, Props>>): boolean {
		return !compare(this.state.config, nextProps.config as Config);
	}
}

export abstract class PanelParentSync<Config = {}, State = {}, Props = {}>
	extends PanelBaseSync<Config_PanelParent<Config>, State, Props> {

	renderPanel(panel: PanelConfig) {
		const PanelRenderer = this.props.renderers[panel.key];
		return <PanelRenderer
			config={panel.data}
			renderers={this.props.renderers}
			onConfigChanged={this.props.onConfigChanged}
		/>;
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