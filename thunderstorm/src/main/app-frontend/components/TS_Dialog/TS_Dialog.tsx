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
import {Dialog_Model, DialogListener, DialogModule} from '../../modules/dialog/DialogModule';
import './TS_Dialog.scss';


type Props = {}

type State = { model?: Dialog_Model };

export class TS_Dialog
	extends ComponentSync<Props, State>
	implements DialogListener {

	protected deriveStateFromProps(nextProps: Props): State {
		return {};
	}

	__showDialog = (model?: Dialog_Model): void => {
		this.setState({model});
	};

	render() {
		const model = this.state.model;
		if (!model)
			return '';

		return (
			<div className="ts-dialog">
				<TS_Overlay showOverlay={true} onClickOverlay={this.onOverlayClicked}>
					{model.content}
				</TS_Overlay>
			</div>
		);
	}

	private onOverlayClicked = (e: React.MouseEvent) => {
		stopPropagation(e);
		if (!this.state.model?.closeOverlayOnClick())
			return;

		DialogModule.close();
	};
}