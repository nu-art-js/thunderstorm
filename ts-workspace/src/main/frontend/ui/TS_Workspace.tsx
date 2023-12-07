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
import {_className, BaseAsyncState, ComponentAsync, TS_Loader} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import './TS_Workspace.scss';
import {PanelConfig, Props_BaseWorkspace} from './types';
import {ModuleFE_Workspace} from '../modules/ModuleFE_Workspace';


type Props = Props_BaseWorkspace & {
	workspaceKey: string;
	id?: string;
	className?: string;
}

type State = {
	config: PanelConfig
}

export class TS_Workspace
	extends ComponentAsync<Props, State> {

	private toRender = false;

	// _constructor() {
	// 	this.logger.setMinLevel(LogLevel.Verbose);
	// }

	protected async deriveStateFromProps(nextProps: Props) {
		const config = await ModuleFE_Workspace.getWorkspaceConfigByKey(nextProps.workspaceKey);
		return {config};
	}

	protected _deriveStateFromProps(nextProps: Props): (BaseAsyncState & State) | undefined {
		const state = super._deriveStateFromProps(nextProps);
		this.toRender = true;
		return state;
	}

	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<BaseAsyncState & State>, nextContext: any): boolean {
		if (this.toRender) {
			this.toRender = false;
			return true;
		}
		return super.shouldComponentUpdate(nextProps, nextState, nextContext);
	}

	private onConfigChanged = async () => {
		const config = this.state.config;
		await ModuleFE_Workspace.setWorkspaceByKey(this.props.workspaceKey, config);
	};

	render() {
		if (!this.state.config)
			return <div className={'loader-container'}><TS_Loader/></div>;

		const PanelRenderer = this.props.renderers[this.state.config.key];
		if (!PanelRenderer)
			return `COULD NOT GET THE WORKSPACE RENDERER FOR KEY ${this.state.config.key}`;

		const className = _className('ts-workspace', this.props.className);
		return <div className={className} id={this.props.id}>
			<PanelRenderer
				config={this.state.config.data}
				renderers={this.props.renderers}
				instances={this.props.instances}
				onConfigChanged={this.onConfigChanged}
			/>
		</div>;
	}
}