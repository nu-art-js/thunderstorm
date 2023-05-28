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
import {generateHex, Module} from '@nu-art/ts-common';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {TS_Tree} from '../../components/TS_Tree';
import {Model_Menu, Model_PopUp, Model_ToolTip, MouseInteractivityType, PopUpListener, ToolTipListener} from './types';

const showPopUp = new ThunderDispatcher<PopUpListener, '__onPopUpDisplay'>('__onPopUpDisplay');
const showToolTip = new ThunderDispatcher<ToolTipListener, '__onToolTipDisplay'>('__onToolTipDisplay');

export class ModuleFE_MouseInteractivity_Class
	extends Module<{}> {
	
	showMenu = (model: Model_Menu) => {
		const content: React.ReactNode = <TS_Tree
			className={'ts-popup__content__menu'}
			id={generateHex(8)}
			adapter={model.adapter}
			onNodeClicked={model.onNodeClicked}
		/>;

		this.showContent({
			id: model.id,
			content,
			originPos: model.originPos,
			modalPos: model.modalPos,
			offset: model.offset,
		});
	};

	showContent = (model: Model_PopUp) => {
		showPopUp.dispatchUI(model);
	};

	showTooltip = (model: Model_ToolTip) => {
		showToolTip.dispatchUI(model);
	};

	hide = (type: MouseInteractivityType) => {
		switch (type) {
			case 'pop-up':
				showPopUp.dispatchUI();
				break;

			case 'tool-tip':
				showToolTip.dispatchUI();
				break;
		}
	};
}

export const ModuleFE_MouseInteractivity = new ModuleFE_MouseInteractivity_Class();