import {ModuleFE_MouseInteractivity} from './ModuleFE_MouseInteractivity.js';
import {mouseInteractivity_ToolTip} from './types.js';
import {generateHex, resolveContent} from '@nu-art/ts-common';
import {stopPropagation} from '@nu-art/web-client';
// ######################### General Helpers #########################
export const resolveRealPosition = (button) => {
	const pos = button.getBoundingClientRect();
	return {y: pos.top + button.offsetHeight, x: pos.left};
};

export function calculateCenterPosition(el) {
	const rect = el.getBoundingClientRect();
	return {
		y: rect.y + (rect.height / 2),
		x: rect.x + (rect.width / 2),
	};
}

export const getElementCenterPos = calculateCenterPosition;

function calculatePosition(e) {
	const rect = e.currentTarget.getBoundingClientRect();
	const x = rect.x + (rect.width / 2);
	const y = rect.y + (rect.height / 2);
	const vMargin = (rect.height / 2);
	const hMargin = (rect.width / 2);
	return {x, y, vMargin, hMargin};
}

export class MenuBuilder {
	adapter;
	originPos;
	modalPos;
	id = generateHex(8);
	offset = {x: 0, y: 0};
	onNodeClicked;
	onNodeDoubleClicked;

	constructor(menu, originPos, modalPos) {
		this.adapter = menu;
		this.originPos = originPos;
		this.modalPos = modalPos;
	}

	show() {
		const model = {
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

	setId(id) {
		this.id = id;
		return this;
	}

	setOffset(offset) {
		this.offset = offset;
		return this;
	}

	setOnClick(func) {
		this.onNodeClicked = func;
		return this;
	}

	setOnDoubleClick(func) {
		this.onNodeDoubleClicked = func;
		return this;
	}
}

const OpenPopUpAtLeft = (id, content, offset) => {
	return OpenPopUpAtLeftV2({id, content, offset, event: 'onClick'});
};
const OpenPopUpAtCenter = (id, content, offset) => {
	return OpenPopUpAtCenterV2({id, content, offset, event: 'onClick'});
};
const OpenPopUpAtRight = (id, content, offset) => {
	return OpenPopUpAtRightV2({id, content, offset, event: 'onClick'});
};
const OpenPopUpAtBottom = (id, content, offset) => {
	return OpenPopUpAtBottomV2({id, content, offset, event: 'onClick'});
};
const OpenPopUpAtTop = (id, content, offset) => {
	return OpenPopUpAtTopV2({id, content, offset, event: 'onClick'});
};
const OpenPopUpAtCenterV2 = (props) => {
	const {id, content, event} = props;
	const _event = event ?? 'onClick';
	return {
		[_event]: (e) => {
			stopPropagation(e);
			const {x, y} = calculatePosition(e);
			const model = {
				id,
				content,
				originPos: {x, y},
				modalPos: {x: 0, y: 0},
			};
			ModuleFE_MouseInteractivity.showContent(model);
		}
	};
};
const OpenPopUpAtLeftV2 = (props) => {
	const {id, content, offset, event} = props;
	const _event = event ?? 'onClick';
	return {
		[_event]: (e) => {
			stopPropagation(e);
			const {x, y, hMargin} = calculatePosition(e);
			const model = {
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
const OpenPopUpAtRightV2 = (props) => {
	const {id, content, offset, event} = props;
	const _event = event ?? 'onClick';
	return {
		[_event]: (e) => {
			stopPropagation(e);
			const {x, y, hMargin} = calculatePosition(e);
			const model = {
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
const OpenPopUpAtBottomV2 = (props) => {
	const {id, content, offset, event} = props;
	const _event = event ?? 'onClick';
	return {
		[_event]: (e) => {
			stopPropagation(e);
			const {x, y, vMargin} = calculatePosition(e);
			const model = {
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
const OpenPopUpAtTopV2 = (props) => {
	const {id, content, offset, event} = props;
	const _event = event ?? 'onClick';
	return {
		[_event]: (e) => {
			stopPropagation(e);
			const {x, y, vMargin} = calculatePosition(e);
			const model = {
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
const OpenToolTipAtCenter = (id, content, config) => {
	return {
		onMouseEnter: (e) => {
			const model = {
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
const OpenToolTipAtLeft = (id, content, config) => {
	return {
		onMouseEnter: (e) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model = {
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
const OpenToolTipAtRight = (id, content, config) => {
	return {
		onMouseEnter: (e) => {
			const margin = (e.currentTarget.getBoundingClientRect().width / 2);
			const model = {
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
const OpenToolTipAtBottom = (id, content, config) => {
	return {
		onMouseEnter: (e) => {
			const margin = (e.currentTarget.getBoundingClientRect().height / 2);
			const model = {
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
const OpenToolTipAtTop = (id, content, config) => {
	return {
		onMouseEnter: (e) => {
			const margin = (e.currentTarget.getBoundingClientRect().height / 2);
			const model = {
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
const OpenToolTipCustom = (id, content, config) => {
	return {
		onMouseEnter: (e) => {
			const model = {
				id,
				content,
				...resolveContent(config?.(e)),
			};
			ModuleFE_MouseInteractivity.showTooltip(model);
		},
		onMouseLeave: () => ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip),
	};
};
// ######################### Menu Helpers #########################
const openMenuAtLeft = (e, content) => {
	return new MenuBuilder(content, calculateCenterPosition(e.currentTarget), {x: -1, y: 0});
};
const openMenuAtRight = (e, content) => {
	return new MenuBuilder(content, calculateCenterPosition(e.currentTarget), {x: 1, y: 0});
};
const openMenuAtTop = (e, content) => {
	return new MenuBuilder(content, calculateCenterPosition(e.currentTarget), {x: 0, y: -1});
};
const openMenuAtBottom = (e, content) => {
	return new MenuBuilder(content, calculateCenterPosition(e.currentTarget), {x: 0, y: 1});
};
const openMenuAtCenter = (e, content) => {
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
		custom: OpenToolTipCustom,
	},
	menu: {
		left: openMenuAtLeft,
		right: openMenuAtRight,
		top: openMenuAtTop,
		bottom: openMenuAtBottom,
		center: openMenuAtCenter,
	}
};
//# sourceMappingURL=helper-functions.js.map