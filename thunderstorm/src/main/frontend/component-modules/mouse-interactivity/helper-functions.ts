import * as React from 'react';
import {ModuleFE_MouseInteractivity} from './ModuleFE_MouseInteractivity';
import {Adapter} from '../../components/adapter/Adapter';
import {Coordinates, Model_Menu, Model_PopUp, Model_ToolTip, mouseInteractivity_ToolTip} from './types';
import {generateHex} from '@nu-art/ts-common';

// ######################### General Helpers #########################

export const resolveRealPosition = (button: HTMLImageElement) => {
	const pos = button.getBoundingClientRect();
	return {y: pos.top + button.offsetHeight, x: pos.left};
};

export const getElementCenterPos = (el: Element): Coordinates => {
	const rect = el.getBoundingClientRect();
	return {
		y: rect.y + (rect.height / 2),
		x: rect.x + (rect.width / 2),
	};
};

export class MenuBuilder {

	private readonly adapter: Adapter;
	private readonly originPos: Coordinates;
	private readonly modalPos: Coordinates;

	private id: string = generateHex(8);
	private offset: Coordinates = {x: 0, y: 0};
	private onNodeClicked?: (path: string, item: any) => void;
	private onNodeDoubleClicked?: Function;

	constructor(menu: Adapter, originPos: Coordinates, modalPos: Coordinates) {
		this.adapter = menu;
		this.originPos = originPos;
		this.modalPos = modalPos;
	}

	show() {
		const model: Model_Menu = {
			id: this.id,
			adapter: this.adapter,
			originPos: this.originPos,
			modalPos: this.modalPos,
			onNodeClicked: this.onNodeClicked,
			onNodeDoubleClicked: this.onNodeDoubleClicked,
			offset: this.offset
		};

		ModuleFE_MouseInteractivity.showMenu(model);
	}

	setId(id: string) {
		this.id = id;
		return this;
	}

	setOffset(offset: Coordinates) {
		this.offset = offset;
		return this;
	}

	setOnClick(func: (path: string, item: any) => void) {
		this.onNodeClicked = func;
		return this;
	}

	setOnDoubleClick(func: Function) {
		this.onNodeDoubleClicked = func;
		return this;
	}
}

// ######################### Pop Up Helpers #########################

const OpenPopUpAtCenter = (id: string, content: () => JSX.Element,) => {
	return {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			const model: Model_PopUp = {
				id,
				content,
				originPos: getElementCenterPos(e.currentTarget),
				modalPos: {x: 0, y: 0},
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};

const OpenPopUpAtLeft = (id: string, content: () => JSX.Element, offset?: number) => {
	return {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_PopUp = {
				id,
				content,
				originPos: getElementCenterPos(e.currentTarget),
				modalPos: {x: -1, y: 0},
				offset: {x: -margin + (offset ?? 0), y: 0}
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};

const OpenPopUpAtRight = (id: string, content: () => JSX.Element, offset?: number) => {
	return {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_PopUp = {
				id,
				content,
				originPos: getElementCenterPos(e.currentTarget),
				modalPos: {x: 1, y: 0},
				offset: {x: margin + (offset ?? 0), y: 0}
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};

const OpenPopUpAtBottom = (id: string, content: () => JSX.Element, offset?: number) => {
	return {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			const triggerRect = e.currentTarget.getBoundingClientRect();
			const x = triggerRect.x + (triggerRect.width / 2);
			const y = triggerRect.y + (triggerRect.height / 2);
			const margin = (triggerRect.height / 2);

			const model: Model_PopUp = {
				id,
				content,
				originPos: {x, y},
				modalPos: {x: 0, y: 1},
				offset: {x: 0, y: margin + (offset ?? 0)}
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};

const OpenPopUpAtTop = (id: string, content: () => JSX.Element, offset?: number) => {
	return {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			const triggerRect = e.currentTarget.getBoundingClientRect();
			const x = triggerRect.x + (triggerRect.width / 2);
			const y = triggerRect.y + (triggerRect.height / 2);
			const margin = (triggerRect.height / 2);

			const model: Model_PopUp = {
				id,
				content,
				originPos: {x, y},
				modalPos: {x: 0, y: -1},
				offset: {x: 0, y: -margin + (offset ?? 0)}
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};

// ######################### Tool Tip Helpers #########################

type ToolTipConfig = {
	contentHoverDelay?: number,
	overlayClass?: string,
	offset?: number
}

const OpenToolTipAtCenter = (id: string, content: () => JSX.Element, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const model: Model_ToolTip = {
				id,
				content,
				originPos: getElementCenterPos(e.currentTarget),
				modalPos: {x: 0, y: 0},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

const OpenToolTipAtLeft = (id: string, content: () => JSX.Element, contentHoverDelay?: number, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_ToolTip = {
				id,
				content,
				originPos: getElementCenterPos(e.currentTarget),
				modalPos: {x: -1, y: 0},
				offset: {x: -margin + (config?.offset ?? 0), y: 0},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

const OpenToolTipAtRight = (id: string, content: () => JSX.Element, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_ToolTip = {
				id,
				content,
				originPos: getElementCenterPos(e.currentTarget),
				modalPos: {x: 1, y: 0},
				offset: {x: margin + (config?.offset ?? 0), y: 0},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

const OpenToolTipAtBottom = (id: string, content: () => JSX.Element, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_ToolTip = {
				id,
				content,
				originPos: getElementCenterPos(e.currentTarget),
				modalPos: {x: 0, y: 1},
				offset: {x: 0, y: margin + (config?.offset ?? 0)},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

const OpenToolTipAtTop = (id: string, content: () => JSX.Element, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_ToolTip = {
				id,
				content,
				originPos: getElementCenterPos(e.currentTarget),
				modalPos: {x: 0, y: -1},
				offset: {x: 0, y: -margin + (config?.offset ?? 0)},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

export const openContent = {
	popUp: {
		left: OpenPopUpAtLeft,
		right: OpenPopUpAtRight,
		top: OpenPopUpAtTop,
		bottom: OpenPopUpAtBottom,
		center: OpenPopUpAtCenter,
	},
	tooltip: {
		left: OpenToolTipAtLeft,
		right: OpenToolTipAtRight,
		top: OpenToolTipAtTop,
		bottom: OpenToolTipAtBottom,
		center: OpenToolTipAtCenter,
	}
};