import * as React from 'react';
import './TS_PopUp.scss';
import {TS_Overlay} from '../../TS_Overlay';
import {OnWindowResized} from '../../../modules/ModuleFE_Window';
import {_className, stopPropagation} from '../../../utils/tools';
import {resolveContent} from '@nu-art/ts-common';
import {TS_MouseInteractivity} from '../base/TS_MouseInteractivity';
import {Model_PopUp, mouseInteractivity_PopUp, PopUpListener} from '../../../component-modules/mouse-interactivity/types';
import {ModuleFE_MouseInteractivity} from '../../../component-modules/mouse-interactivity/ModuleFE_MouseInteractivity';

export class TS_PopUp
	extends TS_MouseInteractivity
	implements PopUpListener, OnWindowResized {

	__onWindowResized(): void {
		if (this.state.model)
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
	}

	__onPopUpDisplay = (model?: Model_PopUp) => {
		this.setState({model, open: !!model});
	};

	render() {
		const {model, open} = this.state;

		if (!model || !open)
			return '';

		return <TS_Overlay
			className={_className('ts-popup', model.overlayClass)}
			showOverlay={open}
			onClickOverlay={(e) => {
				stopPropagation(e);
				this.setState({open: false});
			}}>
			<div className="ts-popup__content" id={model.id} ref={this.ref}>
				{resolveContent(model.content)}
			</div>
		</TS_Overlay>;
	}
}
