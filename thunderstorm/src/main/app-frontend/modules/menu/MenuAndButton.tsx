import * as React from "react";
import {
	CSSProperties,
	ReactNode
} from "react";
import {BaseComponent} from "../../core/BaseComponent";
import {
	Menu_Model,
	MenuBuilder,
	MenuListener,
	// resolveGenericPosition,
	resolveRealPosition
} from "./MenuModule";
import {BadImplementationException} from "@intuitionrobotics/ts-common";
import {Adapter} from "../../components/adapter/Adapter";
import {MenuPosition} from "./PopupMenu";

type Props = {
	id: string
	iconOpen: ReactNode
	iconClosed: ReactNode
	adapter: Adapter
	resolvePosition?: (button: HTMLImageElement) => MenuPosition
	css?: CSSProperties
}

export class MenuAndButton
	extends BaseComponent<Props, { isOpen: boolean, over: boolean }>
	implements MenuListener {

	ref = React.createRef<HTMLImageElement>();

	state = {
		isOpen: false,
		over: false
	};

	__onMenuHide = (id: string) => {
		if (this.props.id !== id)
			return;

		this.setState({isOpen: false});
	};

	__onMenuDisplay = (menu: Menu_Model) => {
		if (this.props.id !== menu.id)
			return;

		this.setState({isOpen: true});
	};

	render() {
		return <div
			className={'clickable'}
			onClick={this.open}
			style={{position: "relative"}}>
			<div ref={this.ref}
			     onMouseOver={e => this.setState({over: true})}
			     onMouseOut={e => this.setState({over: false})}>
				{this.state.isOpen || this.state.over ? this.props.iconClosed : this.props.iconOpen}
			</div>
		</div>
	}



	open = () => {
		if (!this.ref.current)
			throw new BadImplementationException("Could not find image reference");

		new MenuBuilder(this.props.adapter, this.props.resolvePosition ? this.props.resolvePosition(this.ref.current) : resolveRealPosition(this.ref.current), this.props.css && this.props.css)
			.setId(this.props.id)
			.show()  
	}
}