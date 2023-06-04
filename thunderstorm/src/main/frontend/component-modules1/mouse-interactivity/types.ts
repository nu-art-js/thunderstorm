import {Adapter} from '../../components/adapter/Adapter';
import * as React from 'react';
import {ResolvableContent} from '@nu-art/ts-common';

export type MouseInteractivityType = 'pop-up' | 'tool-tip';

export const mouseInteractivity_PopUp: MouseInteractivityType = 'pop-up';
export const mouseInteractivity_ToolTip: MouseInteractivityType = 'tool-tip';

export type Coordinates = { x: number, y: number };

type MouseInteractivity_Model = {
	id: string
	modalPos: Coordinates,
	originPos: Coordinates
	offset?: Partial<Coordinates>
	overlayClass?: string;
	content: ResolvableContent<React.ReactNode>;
	xAxisAnchor?: 'left' | 'right';
	yAxisAnchor?: 'top' | 'bottom';
};

export type Model_Menu = Omit<MouseInteractivity_Model, 'content'> & {
	adapter: Adapter,
	onNodeClicked?: (path: string, item: any) => void
	onNodeDoubleClicked?: Function,
}

export type Model_PopUp = MouseInteractivity_Model;

export type Model_ToolTip = MouseInteractivity_Model & {
	contentHoverDelay?: number;
}

export interface PopUpListener {
	__onPopUpDisplay: (content?: Model_PopUp) => void;
}

export interface ToolTipListener {
	__onToolTipDisplay: (content?: Model_ToolTip) => void;
}