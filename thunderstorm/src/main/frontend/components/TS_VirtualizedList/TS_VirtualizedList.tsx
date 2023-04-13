import * as React from 'react';
import {FixedSizeList as List} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

type Props = {
	listToRender: React.ReactNode[],
	height?: number | string,
	className?: string,
	width?: number,
	itemHeight: number,
	selectedItem?: number
};


const VirtualizedList = ({height, width, listToRender, itemHeight, selectedItem, className}: Props) => {
	const listRef = React.useRef<any>();

	React.useEffect(() => {
		if (selectedItem) {
			listRef.current.scrollToItem(selectedItem, 'center');
		}
	}, [selectedItem, listToRender]);

	function ItemWrapper({index, style}: { index: number, style: any }) {
		return (
			<div style={style}>
				{listToRender[index]}
			</div>
		);

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
			{({height, width}) => <VirtualizedList className={props.className} selectedItem={props.selectedItem} itemHeight={props.itemHeight}
																						 listToRender={props.listToRender} height={height} width={width}/>}
		</AutoSizer>
	);
};
