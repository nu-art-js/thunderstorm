import * as React from 'react';
import {ModuleFE_MouseInteractivity} from './ModuleFE_MouseInteractivity';
import {Adapter} from '../../components/adapter/Adapter';
import {Coordinates, Model_Menu, Model_PopUp, Model_ToolTip, mouseInteractivity_ToolTip} from './types';
import {generateHex, ResolvableContent} from '@nu-art/ts-common';
import {stopPropagation} from '../../utils/tools';

// ######################### General Helpers #########################

export const resolveRealPosition = (button: HTMLImageElement) => {
	const pos = button.getBoundingClientRect();
	return {y: pos.top + button.offsetHeight, x: pos.left};
};

export function calculateCenterPosition(el: Element): Coordinates {
	const rect = el.getBoundingClientRect();
	return {
		y: rect.y + (rect.height / 2),
		x: rect.x + (rect.width / 2),
	};
}

export const getElementCenterPos = calculateCenterPosition;

function calculatePosition(e: React.MouseEvent<HTMLElement>) {
	const rect = e.currentTarget.getBoundingClientRect();
	const x = rect.x + (rect.width / 2);
	const y = rect.y + (rect.height / 2);
	const vMargin = (rect.height / 2);
	const hMargin = (rect.width / 2);
	return {x, y, vMargin, hMargin};
}

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
type OpenPopUpParams = {
	id: string,
	content: ResolvableContent<React.ReactNode, [VoidFunction]>,
	offset?: number
	event?: 'onClick' | 'onContextMenu'
};

const OpenPopUpAtLeft = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
	return OpenPopUpAtLeftV2({id, content, offset, event: 'onClick'});
};

const OpenPopUpAtCenter = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
	return OpenPopUpAtCenterV2({id, content, offset, event: 'onClick'});
};

const OpenPopUpAtRight = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
	return OpenPopUpAtRightV2({id, content, offset, event: 'onClick'});
};

const OpenPopUpAtBottom = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
	return OpenPopUpAtBottomV2({id, content, offset, event: 'onClick'});
};

const OpenPopUpAtTop = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
	return OpenPopUpAtTopV2({id, content, offset, event: 'onClick'});
};

const OpenPopUpAtCenterV2 = (props: OpenPopUpParams) => {
	const {id, content, event} = props;

	const _event = event ?? 'onClick';
	return {
		[_event]: (e: React.MouseEvent<HTMLElement>) => {
			stopPropagation(e);
			const {x, y} = calculatePosition(e);

			const model: Model_PopUp = {
				id,
				content,
				originPos: {x, y},
				modalPos: {x: 0, y: 0},
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};

const OpenPopUpAtLeftV2 = (props: OpenPopUpParams) => {
	const {id, content, offset, event} = props;

	const _event = event ?? 'onClick';
	return {
		[_event]: (e: React.MouseEvent<HTMLElement>) => {
			stopPropagation(e);
			const {x, y, hMargin} = calculatePosition(e);

			const model: Model_PopUp = {
				id,
				content,
				originPos: {x, y},
				modalPos: {x: -1, y: 0},
				offset: {x: -hMargin + (offset ?? 0), y: 0}
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};

const OpenPopUpAtRightV2 = (props: OpenPopUpParams) => {
	const {id, content, offset, event} = props;
	const _event = event ?? 'onClick';
	return {
		[_event]: (e: React.MouseEvent<HTMLElement>) => {
			stopPropagation(e);
			const {x, y, hMargin} = calculatePosition(e);

			const model: Model_PopUp = {
				id,
				content,
				originPos: {x, y},
				modalPos: {x: 1, y: 0},
				offset: {x: hMargin + (offset ?? 0), y: 0}
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};

const OpenPopUpAtBottomV2 = (props: OpenPopUpParams) => {
	const {id, content, offset, event} = props;

	const _event = event ?? 'onClick';
	return {
		[_event]: (e: React.MouseEvent<HTMLElement>) => {
			stopPropagation(e);
			const {x, y, vMargin} = calculatePosition(e);

			const model: Model_PopUp = {
				id,
				content,
				originPos: {x, y},
				modalPos: {x: 0, y: 1},
				offset: {x: 0, y: vMargin + (offset ?? 0)}
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};

const OpenPopUpAtTopV2 = (props: OpenPopUpParams) => {
	const {id, content, offset, event} = props;
	const _event = event ?? 'onClick';
	return {
		[_event]: (e: React.MouseEvent<HTMLElement>) => {
			stopPropagation(e);
			const {x, y, vMargin} = calculatePosition(e);

			const model: Model_PopUp = {
				id,
				content,
				originPos: {x, y},
				modalPos: {x: 0, y: -1},
				offset: {x: 0, y: -vMargin + (offset ?? 0)}
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
	xAxisAnchor?: 'left' | 'right';
	yAxisAnchor?: 'top' | 'bottom';
}

const OpenToolTipAtCenter = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const model: Model_ToolTip = {
				id,
				content,
				originPos: calculateCenterPosition(e.currentTarget),
				modalPos: {x: 0, y: 0},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
				xAxisAnchor: config?.xAxisAnchor,
				yAxisAnchor: config?.yAxisAnchor,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

const OpenToolTipAtLeft = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_ToolTip = {
				id,
				content,
				originPos: calculateCenterPosition(e.currentTarget),
				modalPos: {x: -1, y: 0},
				offset: {x: -margin + (-(config?.offset ?? 0)), y: 0},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
				xAxisAnchor: config?.xAxisAnchor,
				yAxisAnchor: config?.yAxisAnchor,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

const OpenToolTipAtRight = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_ToolTip = {
				id,
				content,
				originPos: calculateCenterPosition(e.currentTarget),
				modalPos: {x: 1, y: 0},
				offset: {x: margin + (config?.offset ?? 0), y: 0},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
				xAxisAnchor: config?.xAxisAnchor,
				yAxisAnchor: config?.yAxisAnchor,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

const OpenToolTipAtBottom = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_ToolTip = {
				id,
				content,
				originPos: calculateCenterPosition(e.currentTarget),
				modalPos: {x: 0, y: 1},
				offset: {x: 0, y: margin + (config?.offset ?? 0)},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
				xAxisAnchor: config?.xAxisAnchor,
				yAxisAnchor: config?.yAxisAnchor,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

const OpenToolTipAtTop = (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model: Model_ToolTip = {
				id,
				content,
				originPos: calculateCenterPosition(e.currentTarget),
				modalPos: {x: 0, y: -1},
				offset: {x: 0, y: -margin + (-(config?.offset ?? 0))},
				contentHoverDelay: config?.contentHoverDelay,
				overlayClass: config?.overlayClass,
				xAxisAnchor: config?.xAxisAnchor,
				yAxisAnchor: config?.yAxisAnchor,
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => {
			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
		}
	};
};

// ######################### Menu Helpers #########################

const openMenuAtLeft = (e: React.MouseEvent, content: Adapter) => {
	return new MenuBuilder(content, calculateCenterPosition(e.currentTarget), {x: -1, y: 0});
};

const openMenuAtRight = (e: React.MouseEvent, content: Adapter) => {
	return new MenuBuilder(content, calculateCenterPosition(e.currentTarget), {x: 1, y: 0});
};

const openMenuAtTop = (e: React.MouseEvent, content: Adapter) => {
	return new MenuBuilder(content, calculateCenterPosition(e.currentTarget), {x: 0, y: -1});
};

const openMenuAtBottom = (e: React.MouseEvent, content: Adapter) => {
	return new MenuBuilder(content, calculateCenterPosition(e.currentTarget), {x: 0, y: 1});
};

const openMenuAtCenter = (e: React.MouseEvent, content: Adapter) => {
	return new MenuBuilder(content, calculateCenterPosition(e.currentTarget), {x: 0, y: 0});
};

export const openContent = {
	popUp: {
		left: OpenPopUpAtLeft,
		right: OpenPopUpAtRight,
		top: OpenPopUpAtTop,
		bottom: OpenPopUpAtBottom,
		center: OpenPopUpAtCenter,
	},
	popUpV2: {
		left: OpenPopUpAtLeftV2,
		right: OpenPopUpAtRightV2,
		top: OpenPopUpAtTopV2,
		bottom: OpenPopUpAtBottomV2,
		center: OpenPopUpAtCenterV2,
	},
	tooltip: {
		left: OpenToolTipAtLeft,
		right: OpenToolTipAtRight,
		top: OpenToolTipAtTop,
		bottom: OpenToolTipAtBottom,
		center: OpenToolTipAtCenter,
	},
	menu: {
		left: openMenuAtLeft,
		right: openMenuAtRight,
		top: openMenuAtTop,
		bottom: openMenuAtBottom,
		center: openMenuAtCenter,
	}
};