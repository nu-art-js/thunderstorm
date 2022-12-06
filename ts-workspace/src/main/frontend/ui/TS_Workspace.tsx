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
import * as React from 'react';
import {PanelParentSync} from './Panels';
import './TS_Workspace.scss';
import {Config_PanelParent} from './types';


export class TS_Workspace
	extends PanelParentSync<Config_PanelParent> {

	_constructor() {
		// this.logger.setMinLevel(LogLevel.Verbose);
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