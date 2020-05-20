import * as React from 'react';
import {_keys} from "@nu-art/ts-common";

import {
	TreeNode,
	Tree
} from "../../components/Tree";
import {
	Collapsed,
	Expanded
} from "../../components/treeicons";
import {
	Menu_Model,
	MenuItemWrapper,
	MenuListener,
	MenuModule
} from "./MenuModule";
import {BaseComponent} from "../../core/BaseComponent";
import {CSSProperties} from "react";
import {RendererMap} from '../../types/renderer-map';


const renderCollapse = (expanded: boolean) => {
	const Comp = expanded ? Expanded : Collapsed;
	return <Comp style={{color: "#00000050", verticalAlign: "text-top"}}/>
};

const GenericRenderer = (rendererMap: RendererMap) => {
	return (props: TreeNode) => {
		const itemWrapper = props.item as MenuItemWrapper<any, any>;
		const item = itemWrapper.item;
		const type = itemWrapper.type;

		const MyRenderer = rendererMap[type as string];
		// @ts-ignore
		const hasChildren = itemWrapper.length;

		return (
			<div style={hasChildren && {display: 'flex', justifyContent: 'space-between'}}>
				<MyRenderer item={item}/>
				{hasChildren && <div
					id={props.path}
					onMouseDown={(e) => stopPropagation(e)}
					onMouseUp={(e) => props.expandToggler(e, !props.expanded)}
					style={{cursor: "pointer", marginRight: 10}}
				>{renderCollapse(props.expanded)}</div>}
			</div>
		)
	};
};

export type MenuPosition = { left: number, top: number };

type State = {
	element?: Menu_Model
}

const stopPropagation = (e: MouseEvent | React.MouseEvent) => {
	e.preventDefault();
	e.stopPropagation();
};

const overlayStyle: CSSProperties = {
	cursor: "default",
	position: "fixed",
	top: 0,
	left: 0,
	bottom: 0,
	right: 0,
	height: "100vh",
	width: "100vw",
	zIndex: 3333
}

export class PopupMenu
	extends BaseComponent<{}, State>
	implements MenuListener {

	overlayRef = React.createRef<HTMLDivElement>();

	__onMenuDisplay = (element?: Menu_Model) => this.setState({element});

	componentDidMount(): void {
		this.eventListenersEffect();
	}

	componentDidUpdate(): void {
		this.eventListenersEffect();
	}

	componentWillUnmount(): void {
		const current = this.overlayRef.current;
		if (current) {
			current.removeEventListener("mousedown", this.stopClickCascading, false);
			current.removeEventListener("mouseup", this.closeMenu, false);
		}
	}

	stopClickCascading = (e: MouseEvent) => {
		if (this.overlayRef.current === e.target)
			stopPropagation(e);
	};

	closeMenu = (e: MouseEvent) => {
		if (e.which === 3)
			return

		if (this.overlayRef.current !== e.target)
			return

		stopPropagation(e);
		const id = this.state?.element?.id;
		id && MenuModule.hide(id)
		this.setState({element: undefined});
	};

	childrenContainerStyle = (level: number, pos: MenuPosition): CSSProperties => {
		if (level === 1)
			return {
				width: 225,
				overflowX: "hidden",
				overflowY: "scroll",
				maxHeight: "60vh",
				borderRadius: 2,
				boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.3)",
				border: "solid 1px transparent",
				backgroundColor: "#fff",
				position: "absolute",
				top: pos.top,
				right: window.innerWidth - pos.left
			}

		return {
			backgroundColor: "#fff",
			boxSizing: "border-box",
			display: "inline-block",
			paddingLeft: 20,
			width: "-webkit-fill-available"
		}
	};

	render() {
		const element = this.state?.element;
		if (!element)
			return null;

		return <div style={{position: "absolute"}}>
			<div id="overlay" ref={this.overlayRef} style={overlayStyle}>
				<Tree
					root={element.menu}
					hideRootElement={true}
					nodeAdjuster={(obj: object) => {
						if (!_keys(obj).find(key => key === "_children"))
							return {data: obj};

						// @ts-ignore
						const objElement = obj['_children'];
						// @ts-ignore
						objElement.type = obj.type;
						// @ts-ignore
						objElement.item = obj.item;

						// @ts-ignore
						return {data: objElement, deltaPath: '_children'};
					}}
					propertyFilter={<T extends object>(obj: T, key: keyof T) => key !== "item" && key !== 'type'}
					indentPx={0}
					childrenContainerStyle={(level: number) => this.childrenContainerStyle(level, element.pos)}
					callBackState={(key: string, value: any, level: number) => true}
					renderer={GenericRenderer(element.menu.rendererMap)}
				/>
			</div>
		</div>;
	}

	private eventListenersEffect = () => {
		const _current = this.overlayRef.current;
		if (!_current)
			return;

		_current.addEventListener("mousedown", this.stopClickCascading, false);
		_current.addEventListener("mouseup", this.closeMenu, false);
	};
};