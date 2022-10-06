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

/*	QWorkspaceVertical	- content display and resizing
*	When given panel contents and a page, displays content in resizable panels.*/
import {compare, LogLevel} from '@nu-art/ts-common';
import * as React from 'react';
import {ComponentAsync} from '../../core/ComponentAsync';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_Workspace.scss';
import {Config_PanelParent, PanelConfig, Props_WorkspacePanel, State_WorkspacePanel} from './types';


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
			onConfigChanged={this.props.onConfigChanged}/>;
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

	_constructor() {
		this.logger.setMinLevel(LogLevel.Verbose);
	}

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