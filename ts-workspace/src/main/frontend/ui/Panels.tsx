import * as React from 'react';
import {Config_PanelParent, PanelConfig, Props_WorkspacePanel, State_WorkspacePanel} from './types';
import {
	ComponentAsync,
	ComponentStatus,
	ComponentSync,
	SmartComponent,
	State_SmartComponent
} from '@nu-art/thunderstorm/frontend';
import {compare, resolveContent} from '@nu-art/ts-common';


export abstract class PanelBaseSync<Config, State = {}, Props = {}>
	extends ComponentSync<Props_WorkspacePanel<Config, Props> & Props, State_WorkspacePanel<Config, State>> {

	protected shouldAlwaysReDerive: boolean = false;

	protected deriveStateFromProps(nextProps: Props_WorkspacePanel<Config, Props>): State_WorkspacePanel<Config, State> {
		return {config: {...nextProps.config}} as State_WorkspacePanel<Config, State>;
	}

	shouldReDeriveState(nextProps: Readonly<Props_WorkspacePanel<Config, Props>>): boolean {
		return this.shouldAlwaysReDerive || !compare(this.state.config, nextProps.config as Config);
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
		const ComponentToRender = resolveContent(this.props.instances?.[panel.key], panel.data, this.props.onConfigChanged);
		if (ComponentToRender) {
			this.shouldAlwaysReDerive = true;
			return ComponentToRender;
		}

		const PanelRenderer = this.props.renderers[panel.key];
		return <PanelRenderer
			config={panel.data}
			instances={this.props.instances}
			renderers={this.props.renderers}
			onConfigChanged={this.props.onConfigChanged}
		/>;
	}
}

export abstract class PanelParentAsync<Config = {}, State = {}, Props = {}>
	extends PanelBaseAsync<Config_PanelParent<Config>, State, Props> {

	renderPanel(panel: PanelConfig) {

		const ComponentToRender = resolveContent(this.props.instances?.[panel.key], panel.data, this.props.onConfigChanged);
		if (ComponentToRender)
			return ComponentToRender;

		const PanelRenderer = this.props.renderers[panel.key];
		if (!PanelRenderer)
			return `NO RENDERER DEFINED FOR KEY: ${panel.key}`;
		return <PanelRenderer config={panel.data} renderers={this.props.renderers} instances={this.props.instances}/>;
	}
}

export abstract class SmartPanel<Config, State = {}, Props = {}>
	extends SmartComponent<Props_WorkspacePanel<Config, Props>, State_WorkspacePanel<Config, State>> {

	protected createInitialState(nextProps: Props_WorkspacePanel<Config, Props>) {
		return {
			componentPhase: ComponentStatus.Loading,
			config: {...nextProps.config}
		} as State_WorkspacePanel<Config, State> & State_SmartComponent;
	}

	shouldReDeriveState(nextProps: Readonly<Props_WorkspacePanel<Config, Props>>): boolean {
		if (!super.shouldReDeriveState(nextProps))
			return false;

		const ans = !compare(this.state.config, nextProps.config as Config);
		this.logDebug('Should ReDerive:', ans);
		return ans;
	}
}