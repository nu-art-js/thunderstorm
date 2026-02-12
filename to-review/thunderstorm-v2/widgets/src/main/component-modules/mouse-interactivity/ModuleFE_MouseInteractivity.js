import {jsx as _jsx} from "react/jsx-runtime";
import {generateHex, Module} from '@nu-art/ts-common';
import {TS_Tree} from '../../components/TS_Tree/index.js';
import {ThunderDispatcher} from '@nu-art/web-client';

const showPopUp = new ThunderDispatcher('__onPopUpDisplay');
const showToolTip = new ThunderDispatcher('__onToolTipDisplay');

export class ModuleFE_MouseInteractivity_Class extends Module {
	showMenu = (model) => {
		const content = _jsx(TS_Tree, {className: 'ts-popup__content__menu', id: generateHex(8), adapter: model.adapter, onNodeClicked: model.onNodeClicked});
		this.showContent({
			id: model.id,
			content,
			originPos: model.originPos,
			modalPos: model.modalPos,
			offset: model.offset,
		});
	};
	showContent = (model) => {
		showPopUp.dispatchUI(model);
	};
	showTooltip = (model) => {
		showToolTip.dispatchUI(model);
	};
	hide = (type) => {
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
//# sourceMappingURL=ModuleFE_MouseInteractivity.js.map