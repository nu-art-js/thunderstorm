import * as React from 'react';
import {FixedSizeList as List} from 'react-window';
import AutoSizer, {Size} from 'react-virtualized-auto-sizer';
import {ResolvableContent, resolveContent} from '@nu-art/ts-common';


type Props = {
	listToRender: ResolvableContent<React.ReactNode>[],
	height?: number | string,
	className?: string,
	width?: number,
	itemHeight: number,
	selectedItem?: number
};

export const VirtualizedList = ({height, width, listToRender, itemHeight, selectedItem, className}: Props) => {
	const listRef = React.useRef<any>();

	React.useEffect(() => {
		if (selectedItem) {
			listRef.current.scrollToItem(selectedItem, 'center');
		}
	}, [selectedItem, listToRender]);

	function ItemWrapper({index, style}: { index: number, style: any }) {
		return <div style={style}>
			{resolveContent(listToRender[index])}
		</div>;
	}

	return (
		<List
			ref={listRef}
			itemSize={itemHeight}
			height={height!}
			width={width!}
			itemCount={listToRender.length}
			className={className}
			itemKey={index => index}
		>
			{ItemWrapper}
		</List>
	);
};

export const TS_VirtualizedList = (props: Props) => {
	return (
		<AutoSizer>
			{(size: Size) => <VirtualizedList className={props.className} selectedItem={props.selectedItem}
																				itemHeight={props.itemHeight}
																				listToRender={props.listToRender}
																				height={props.height ?? size.height}
																				width={size.width}/>}
		</AutoSizer>
	);
};
