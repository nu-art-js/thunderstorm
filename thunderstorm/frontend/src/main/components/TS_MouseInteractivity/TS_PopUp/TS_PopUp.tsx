import './TS_PopUp.scss';
import {TS_Overlay} from '../../TS_Overlay/index.js';
import {OnWindowResized} from '../../../modules/ModuleFE_Window.js';
import {_className, stopPropagation} from '../../../utils/tools.js';
import {resolveContent} from '@nu-art/ts-common';
import {TS_MouseInteractivity} from '../base/TS_MouseInteractivity.js';
import {Model_PopUp, mouseInteractivity_PopUp, PopUpListener} from '../../../component-modules/mouse-interactivity/types.js';
import {ModuleFE_MouseInteractivity} from '../../../component-modules/mouse-interactivity/ModuleFE_MouseInteractivity.js';

export class TS_PopUp
	extends TS_MouseInteractivity<Model_PopUp>
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
				if (!model.ignoreOverlayClick || !resolveContent(model?.ignoreOverlayClick))
					this.setState({open: false});
				ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
				model?.onOverlayClick?.(e);
			}}>
			<div className="ts-popup__content" id={model.id} ref={this.ref} onClick={stopPropagation} onContextMenu={stopPropagation}>
				{resolveContent(model.content, () => this.forceUpdate())}
			</div>
		</TS_Overlay>;
	}
}
