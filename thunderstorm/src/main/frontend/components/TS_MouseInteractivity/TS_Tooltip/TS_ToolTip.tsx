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
import './TS_ToolTip.scss';
import {TS_MouseInteractivity} from '../base/TS_MouseInteractivity';
import {OnWindowResized} from '../../../modules';
import {resolveContent} from '@nu-art/ts-common';
import {Model_ToolTip, mouseInteractivity_ToolTip, ToolTipListener} from '../../../component-modules/mouse-interactivity/types';
import {ModuleFE_MouseInteractivity} from '../../../component-modules/mouse-interactivity/ModuleFE_MouseInteractivity';

export class TS_ToolTip
	extends TS_MouseInteractivity
	implements OnWindowResized, ToolTipListener {

	private timeout: NodeJS.Timeout | undefined = undefined;

	__onWindowResized = () => {
		if (this.state.model?.id)
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
	};

	__onToolTipDisplay = (model?: Model_ToolTip) => {
		//Clear timeout if one exists
		if (this.timeout)
			clearTimeout(this.timeout);

		//If a model is given
		if (model)
			return this.setState({model, open: true});

		//Model is not given
		const allowContentHover = this.state.model?.contentHoverDelay;
		if (allowContentHover)
			this.timeout = setTimeout(() => {
				this.setState({model: undefined, open: false});
			}, allowContentHover);

		else
			this.setState({model: undefined, open: false});
	};

	private onContentMouseEnter = () => {
		if (!this.state.model?.contentHoverDelay)
			return;

		//Clear the timeout to stop hiding the content
		if (this.timeout)
			clearTimeout(this.timeout);
	};

	private onContentMouseLeave = () => {
		ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
	};

	render() {
		const {model, open} = this.state;

		if (!model || !open)
			return '';

		return <div
			className={'ts-tooltip__content'}
			id={model.id}
			ref={this.ref}
			onMouseEnter={this.onContentMouseEnter}
			onMouseLeave={this.onContentMouseLeave}
			onMouseMove={this.onContentMouseEnter}
		>
			{resolveContent(model.content)}
		</div>;
		// return <TS_Overlay
		// 	className={_className('ts-tooltip', model.overlayClass)}
		// 	showOverlay={open}
		// 	onClickOverlay={(e) => {
		// 		stopPropagation(e);
		// 		this.setState({open: false});
		// 	}}>
		// 	<div
		// 		className={'ts-tooltip__content'}
		// 		id={model.id}
		// 		ref={this.ref}
		// 		onMouseEnter={this.onContentMouseEnter}
		// 		onMouseLeave={this.onContentMouseLeave}
		// 		onMouseMove={this.onContentMouseEnter}
		// 	>
		// 		{resolveContent(model.content)}
		// 	</div>
		// </TS_Overlay>;
	}
}