import {Module} from '@nu-art/ts-common';
import {Model_Menu, Model_PopUp, Model_ToolTip, MouseInteractivityType} from './types.js';

export declare class ModuleFE_MouseInteractivity_Class
	extends Module<{}> {
	showMenu: (model: Model_Menu) => void;
	showContent: (model: Model_PopUp) => void;
	showTooltip: (model: Model_ToolTip) => void;
	hide: (type: MouseInteractivityType) => void;
}

export declare const ModuleFE_MouseInteractivity: ModuleFE_MouseInteractivity_Class;
