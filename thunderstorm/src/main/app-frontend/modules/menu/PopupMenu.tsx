import * as React from 'react';
import {CSSProperties} from 'react';
import {_keys} from "@nu-art/ts-common";

import {
	Tree,
	TreeNode
} from "../../components/Tree";
import {
	Collapsed,
	Expanded
} from "../../components/treeicons";
import {
	Menu,
	Menu_Model,
	MenuItemWrapper,
	MenuListener,
	MenuModule
} from "./MenuModule";
import {BaseComponent} from "../../core/BaseComponent";
import {RendererMap} from '../../types/renderer-map';


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

	__onMenuDisplay = (element: Menu_Model) => this.setState({element});

	__onMenuHide = (id: string) => {
		const element = this.state.element;
		if (!element || element.id !== id)
			return

		this.setState({element: undefined});
	};

	componentDidMount(): void {
		this.eventListenersEffect();
	}

	componentDidUpdate(): void {
		this.eventListenersEffect();
	}

	private eventListenersEffect = () => {
		const _current = this.overlayRef.current;
		if (!_current)
			return;

		_current.addEventListener("mousedown", this.stopClickCascading, false);
		_current.addEventListener("mouseup", this.closeMenu, false);
	};

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
			return;

		stopPropagation(e);
		const id = this.state?.element?.id;
		id && MenuModule.hide(id)
		this.setState({element: undefined});
	};

	style = (pos: MenuPosition): CSSProperties => {
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
	};

	render() {
		const element = this.state?.element;
		if (!element)
			return null;

		return <div style={{position: "absolute"}}>
			<div id="overlay" ref={this.overlayRef} style={overlayStyle}>
				<div style={this.style(element.pos)}>
					<HackMenu menu={element.menu}/>
				</div>
			</div>
		</div>;
	}
};

type HMProps = {
	menu: Menu<any>
}

class HackMenu
	extends BaseComponent<HMProps> {

	render() {
		return <Tree
			root={this.props.menu}
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
			childrenContainerStyle={(level: number) => ({
				backgroundColor: "#fff",
				boxSizing: "border-box",
				display: "inline-block",
				paddingLeft: 20,
				width: "-webkit-fill-available"
			})}
			callBackState={(key: string, value: any, level: number) => true}
			renderer={GenericRenderer(this.props.menu.rendererMap)}
		/>
	}
}

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