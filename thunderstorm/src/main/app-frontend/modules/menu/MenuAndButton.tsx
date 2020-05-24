import * as React from "react";
import {BaseComponent} from "../../core/BaseComponent";
import {
	Menu,
	Menu_Model,
	MenuBuilder,
	MenuListener,
	resolveRealPosition
} from "./MenuModule";
import { BadImplementationException } from "@nu-art/ts-common";

type Props = {
	id: string
	iconOpen: string
	iconClosed: string
	menu: Menu<any>
}

export class MenuAndButton
	extends BaseComponent<Props, { isOpen: boolean }>
	implements MenuListener {

	ref = React.createRef<HTMLImageElement>();

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
		return <div className={'clickable'} onClick={this.open} style={{position: "relative", padding: 10}}>
			<img
				ref={this.ref}
				src={this.state.isOpen ? this.props.iconClosed : this.props.iconOpen}
				onMouseOver={e => e.currentTarget.src = this.props.iconOpen}
				onMouseOut={e => e.currentTarget.src = this.props.iconClosed}
				alt={"openMenu"}/>
		</div>
	}

	open = () => {
		if(!this.ref.current)
			throw new BadImplementationException("Could not find image reference");

		new MenuBuilder(this.props.menu, resolveRealPosition(this.ref.current))
			.setId(this.props.id)
			.show()
	}
}