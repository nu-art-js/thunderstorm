import * as React from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {FixedSizeList as List} from 'react-window';
import AutoSizer, {Size} from 'react-virtualized-auto-sizer';
import {ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {_className} from '@nu-art/thunder-core';
import {
	TreeList_Overscan,
	TreeList_ScrollTail,
	virtualLayout,
	virtualSlice,
} from './virtual-window.js';
import './TS_VirtualizedList.scss';

type LegacyProps = {
	listToRender: ResolvableContent<React.ReactNode, [React.CSSProperties]>[];
	height?: number | string;
	className?: string;
	width?: number;
	itemHeight: number;
	selectedItem?: number;
	omitWrapper?: boolean;
};

export type VirtualListHandle = {
	readonly element: HTMLDivElement | null;
	scrollToIndex: (index: number) => void;
};

export type Props_WindowedList<T> = {
	items: readonly T[];
	itemHeight: number | ((item: T, index: number) => number);
	itemKey: (item: T, index: number) => string;
	renderItem: (item: T, index: number) => ReactNode;
	className?: string;
	/** Accessible name for the scrollport. */
	label?: string;
	/** Written to `--wired-tree-row-height` when `itemHeight` is a function. */
	rowHeight?: number;
	onScroll?: () => void;
	handleRef?: (handle: VirtualListHandle | null) => void;
};

/**
 * One scrollport. The spacer is the full list height. Only the slice in view is mounted.
 * `listToRender` keeps the older fixed-height caller working.
 */
export function TS_VirtualizedList<T>(props: Props_WindowedList<T>): React.ReactElement;
export function TS_VirtualizedList(props: LegacyProps): React.ReactElement;
export function TS_VirtualizedList<T>(props: Props_WindowedList<T> | LegacyProps): React.ReactElement {
	if ('listToRender' in props)
		return <LegacyAutoSize {...props}/>;

	return <WindowedList {...props}/>;
}

const WindowedList = <T,>(props: Props_WindowedList<T>) => {
	const scrollerRef = React.useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = React.useState(0);
	const [viewport, setViewport] = React.useState(0);
	const layout = virtualLayout(props.items.length, itemHeightOf(props));
	const layoutRef = React.useRef(layout);
	layoutRef.current = layout;
	const slice = virtualSlice(props.items.length, scrollTop, viewport, layout, TreeList_Overscan);
	const rowHeight = typeof props.itemHeight === 'number' ? props.itemHeight : props.rowHeight;
	const style = {
		'--wired-tree-row-height': rowHeight ? `${rowHeight}px` : undefined,
	} as CSSProperties;

	React.useLayoutEffect(() => {
		const element = scrollerRef.current;
		if (!element)
			return;

		const measure = () => {
			const next = element.clientHeight;
			setViewport(current => current === next ? current : next);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	React.useLayoutEffect(() => {
		if (!props.handleRef)
			return;

		const handle: VirtualListHandle = {
			get element() {
				return scrollerRef.current;
			},
			scrollToIndex: index => {
				const element = scrollerRef.current;
				const current = layoutRef.current;
				if (!element || index < 0 || index >= props.items.length)
					return;

				const top = current.offsetAt(index);
				const bottom = top + current.heightAt(index);
				const viewTop = element.scrollTop;
				const viewBottom = viewTop + element.clientHeight;
				const inView = top >= viewTop && bottom <= viewBottom - TreeList_ScrollTail;
				if (inView)
					return;

				const deltaTop = top - viewTop;
				const deltaBottom = bottom - viewBottom + TreeList_ScrollTail;
				element.scrollTop = viewTop + (Math.abs(deltaTop) < Math.abs(deltaBottom) ? deltaTop : deltaBottom);
			},
		};
		props.handleRef(handle);
		return () => props.handleRef?.(null);
	}, [props.handleRef, props.items.length]);

	const onScroll = () => {
		const element = scrollerRef.current;
		if (!element)
			return;

		setScrollTop(element.scrollTop);
		props.onScroll?.();
	};

	return <div
		ref={scrollerRef}
		className={_className('virtual-list', props.className)}
		style={style}
		aria-label={props.label}
		onScroll={onScroll}>
		<div className={'virtual-list__spacer'} style={{height: layout.total + TreeList_ScrollTail}}>
			<div className={'virtual-list__window'} style={{top: layout.offsetAt(slice.start)}}>
				{props.items.slice(slice.start, slice.end).map((item, offset) => {
					const index = slice.start + offset;
					return <div
						key={props.itemKey(item, index)}
						className={'virtual-list__row'}
						style={{height: layout.heightAt(index)}}>
						{props.renderItem(item, index)}
					</div>;
				})}
			</div>
		</div>
	</div>;
};

const itemHeightOf = <T,>(props: Props_WindowedList<T>): number | ((index: number) => number) => {
	const itemHeight = props.itemHeight;
	if (typeof itemHeight === 'number')
		return itemHeight;

	return index => itemHeight(props.items[index], index);
};

export const VirtualizedList = ({height, width, listToRender, itemHeight, selectedItem, className, omitWrapper}: LegacyProps) => {
	const listRef = React.useRef<List>(null);

	React.useEffect(() => {
		if (selectedItem)
			listRef.current?.scrollToItem(selectedItem, 'center');
	}, [selectedItem, listToRender]);

	function ItemWrapper({index, style}: {index: number; style: CSSProperties}) {
		if (omitWrapper)
			return <>{resolveContent(listToRender[index], style)}</>;

		return <div style={style}>
			{resolveContent(listToRender[index], style)}
		</div>;
	}

	return <List
		ref={listRef}
		itemSize={itemHeight}
		height={height as number}
		width={width as number}
		itemCount={listToRender.length}
		className={className}
		itemKey={index => index}>
		{ItemWrapper}
	</List>;
};

const LegacyAutoSize = (props: LegacyProps) =>
	<AutoSizer>
		{(size: Size) => <VirtualizedList
			className={props.className}
			selectedItem={props.selectedItem}
			itemHeight={props.itemHeight}
			listToRender={props.listToRender}
			omitWrapper={props.omitWrapper}
			height={props.height ?? size.height}
			width={props.width ?? size.width}/>}
	</AutoSizer>;
