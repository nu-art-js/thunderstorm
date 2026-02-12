import * as React from 'react';
import {Adapter} from '../../components/adapter/Adapter.js';
import {Coordinates, Model_ToolTip} from './types.js';
import {ResolvableContent} from '@nu-art/ts-common';

export declare const resolveRealPosition: (button: HTMLImageElement) => {
	y: number;
	x: number;
};

export declare function calculateCenterPosition(el: Element): Coordinates;

export declare const getElementCenterPos: typeof calculateCenterPosition;

export declare class MenuBuilder {
	private readonly adapter;
	private readonly originPos;
	private readonly modalPos;
	private id;
	private offset;
	private onNodeClicked?;
	private onNodeDoubleClicked?;

	constructor(menu: Adapter, originPos: Coordinates, modalPos: Coordinates);

	show(): void;

	setId(id: string): this;

	setOffset(offset: Coordinates): this;

	setOnClick(func: (path: string, item: any) => void): this;

	setOnDoubleClick(func: Function): this;
}

type OpenPopUpParams = {
	id: string;
	content: ResolvableContent<React.ReactNode, [VoidFunction]>;
	offset?: number;
	event?: 'onClick' | 'onContextMenu';
};
type ToolTipConfig = {
	contentHoverDelay?: number;
	overlayClass?: string;
	offset?: number;
	xAxisAnchor?: 'left' | 'right';
	yAxisAnchor?: 'top' | 'bottom';
};
export declare const openContent: {
	popUp: {
		left: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
		right: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
		top: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
		bottom: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
		center: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, offset?: number) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
	};
	popUpV2: {
		left: (props: OpenPopUpParams) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
		right: (props: OpenPopUpParams) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
		top: (props: OpenPopUpParams) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
		bottom: (props: OpenPopUpParams) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
		center: (props: OpenPopUpParams) => {
			[x: string]: (e: React.MouseEvent<HTMLElement>) => void;
		};
	};
	tooltip: {
		left: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
			onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
			onMouseLeave: () => void;
		};
		right: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
			onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
			onMouseLeave: () => void;
		};
		top: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
			onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
			onMouseLeave: () => void;
		};
		bottom: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
			onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
			onMouseLeave: () => void;
		};
		center: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config?: ToolTipConfig) => {
			onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
			onMouseLeave: () => void;
		};
		custom: (id: string, content: ResolvableContent<React.ReactNode, [VoidFunction]>, config: (e: React.MouseEvent<HTMLElement>) => Omit<Model_ToolTip, 'id' | 'content'>) => {
			onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
			onMouseLeave: () => void;
		};
	};
	menu: {
		left: (e: React.MouseEvent, content: Adapter) => MenuBuilder;
		right: (e: React.MouseEvent, content: Adapter) => MenuBuilder;
		top: (e: React.MouseEvent, content: Adapter) => MenuBuilder;
		bottom: (e: React.MouseEvent, content: Adapter) => MenuBuilder;
		center: (e: React.MouseEvent, content: Adapter) => MenuBuilder;
	};
};
export {};
