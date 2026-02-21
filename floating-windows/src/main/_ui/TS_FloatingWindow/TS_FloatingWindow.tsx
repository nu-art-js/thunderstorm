import * as React from 'react';
import {_className} from '@nu-art/thunder-core';
import {ComponentSync} from '@nu-art/thunder-widgets';
import {Model_FloatingWindow} from '../../types.js';
import {FloatingWindows_FocusWindow} from '../../_dispatchers/focus-window.js';
import {BadImplementationException, Debounce, Second} from '@nu-art/ts-common';
import {ModuleFE_FloatingWindows} from '../../_modules/ModuleFE_FloatingWindows.js';
import './TS_FloatingWindow.scss';

type Props = { model: Model_FloatingWindow };

export class TS_FloatingWindow
	extends ComponentSync<Props>
	implements FloatingWindows_FocusWindow {

	static runningZIndex: number = 0;

	private wrapperRef: React.RefObject<HTMLDivElement> = React.createRef();
	private anchorRef: React.RefObject<HTMLDivElement> = React.createRef();

	private focusTimeout?: NodeJS.Timeout;
	private resizeDebouncer = new Debounce(() => this.onResize(), 100, 250);
	private resizeObserver = new ResizeObserver(() => this.resizeDebouncer.trigger());
	private dragOffset?: { x: number; y: number };

	//######################### Life Cycle #########################

	//Logic for programmatic focus
	__onFocusFloatingWindow = (windowKey: string) => {
		if (windowKey !== this.props.model.key)
			return;

		const wrapper = this.wrapperRef.current;
		if (!wrapper)
			return;

		wrapper.focus();
		wrapper.classList.add('focus');
		//Bring to foreground
		if (Number(wrapper.style.zIndex) !== TS_FloatingWindow.runningZIndex)
			wrapper.style.zIndex = `${++TS_FloatingWindow.runningZIndex}`;

		this.focusTimeout = setTimeout(() => {
			wrapper.classList.remove('focus');
			delete this.focusTimeout;
		}, Second);
	};

	componentDidMount() {
		const wrapper = this.getWrapperElement();
		//Focus the window when it first mounts
		wrapper.focus();
		this.resizeObserver.observe(wrapper);
	}

	componentWillUnmount() {
		clearTimeout(this.focusTimeout);
		this.resizeObserver.disconnect();
	}

	//######################### Logic #########################

	private closeWindow = () => {
		ModuleFE_FloatingWindows.window.remove(this.props.model.key);
	};

	private getClassName = () => {
		const model = this.props.model;
		return _className(
			'ts-floating-window',
			model.resizable && 'resizable',
			model.className,
		);
	};

	private getStyle = (): React.CSSProperties => {
		const model = this.props.model;
		return {
			left: model.rect.x,
			top: model.rect.y,
			width: model.rect.width,
			height: model.rect.height,
			zIndex: ++TS_FloatingWindow.runningZIndex,
		};
	};

	private getWrapperElement = () => {
		const wrapper = this.wrapperRef.current;
		if (!wrapper)
			throw new BadImplementationException('Wrapper ref disconnected!');

		return wrapper;
	};

	private getAnchorElement = () => {
		const anchorElement = this.anchorRef.current;
		if (!anchorElement)
			throw new BadImplementationException('Anchor ref disconnected!');

		return anchorElement;
	};

	//######################### Event Callbacks #########################

	private onResize = () => {
		const wrapper = this.getWrapperElement();
		const model = this.props.model;
		const rect = wrapper.getBoundingClientRect();
		model.rect.x = rect.x;
		model.rect.y = rect.y;
		model.rect.height = rect.height;
		model.rect.width = rect.width;
	};

	//Logic for UI focus
	private onFocus = () => {
		const wrapper = this.getWrapperElement();
		//Bring to foreground
		if (Number(wrapper.style.zIndex) !== TS_FloatingWindow.runningZIndex)
			wrapper.style.zIndex = `${++TS_FloatingWindow.runningZIndex}`;
	};

	private onDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
		const anchor = this.getAnchorElement();
		const wrapper = this.getWrapperElement();
		anchor.addEventListener('pointermove', this.onDragMove);
		anchor.addEventListener('pointerup', this.onDragEnd);
		wrapper.classList.add('dragging');
		//Calc x & y offset from wrapper top-left corner
		this.dragOffset = {
			x: e.clientX - this.props.model.rect.x,
			y: e.clientY - this.props.model.rect.y,
		};
	};

	private onDragMove = (e: MouseEvent) => {
		const newX = e.clientX - (this.dragOffset?.x ?? 0);
		const newY = e.clientY - (this.dragOffset?.y ?? 0);
		this.props.model.rect.x = newX;
		this.props.model.rect.y = newY;
		const wrapper = this.getWrapperElement();
		wrapper.style.left = `${newX}px`;
		wrapper.style.top = `${newY}px`;
	};

	private onDragEnd = () => {
		const anchor = this.getAnchorElement();
		const wrapper = this.getWrapperElement();
		anchor.removeEventListener('pointermove', this.onDragMove);
		anchor.removeEventListener('pointerup', this.onDragEnd);
		wrapper.classList.remove('dragging');
		delete this.dragOffset;
	};

	//######################### Render #########################

	render() {
		const model = this.props.model;
		return <div
			ref={this.wrapperRef}
			className={this.getClassName()}
			style={this.getStyle()}
			tabIndex={0}
			onFocus={this.onFocus}
		>
			{this.render_DragAnchor()}
			{model.content(this.closeWindow)}
		</div>;
	}

	private render_DragAnchor = () => {
		const model = this.props.model;
		if (!model.moveable)
			return;

		return <div
			ref={this.anchorRef}
			className={'ts-floating-window__drag-anchor'}
			onPointerDown={this.onDragStart}
		/>;
	};
}