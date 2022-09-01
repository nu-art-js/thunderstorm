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

import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_Overlay} from '../TS_Overlay';
import {stopPropagation} from '../../utils/tools';
import {Dialog_Model, DialogListener, ModuleFE_Dialog} from '../../component-modules/ModuleFE_Dialog';
import './TS_DialogOverlay.scss';


type Props = {}

type State = { models: Dialog_Model[] };

export class TS_DialogOverlay
	extends ComponentSync<Props, State>
	implements DialogListener {

	protected deriveStateFromProps(nextProps: Props): State {
		return {models: []};
	}

	__showDialog = (model?: Dialog_Model): void => {
		if (!model) {
			this.state.models.pop();
		} else {
			this.state.models.push(model);
		}
		this.forceUpdate();
	};

	render() {
		if (!this.state.models.length)
			return '';

		return (
			<div className="ts-dialog__overlay">
				<TS_Overlay showOverlay={true} onClickOverlay={this.onOverlayClicked}>
					{this.state.models.map((model, i) => {
						if (i === this.state.models.length - 1)
							//This model content is wrapped in a div to keep the React hierarchy. if you remove it, the model stack won't work.
							return <div key={i}>{model.content}</div>;

						return <div key={i} style={{visibility: 'hidden', height: 0}}>{model.content}</div>;
					})}
				</TS_Overlay>
			</div>
		);
	}


	private onOverlayClicked = (e: React.MouseEvent) => {
		stopPropagation(e);
		//Exit if click should not close this current dialog
		if (!this.state.models[0].closeOverlayOnClick())
			return;

		//Close there is only one dialog
		if (this.state.models.length === 1)
			return ModuleFE_Dialog.close();

		//Close only this dialog if more than one
		this.state.models.pop();
		this.forceUpdate();
	};
}