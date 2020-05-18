import * as React from "react";
import {BaseComponent} from "../../core/BaseComponent";
import {
	Menu,
	MenuBuilder,
	MenuListener,
	resolveRealPosition
} from "./MenuModule";

type Props = {
	id: string
	iconOpen: string
	iconClosed: string
	menu: Menu<any>
}

export class MenuAndButton
	extends BaseComponent<Props, {}>
	implements MenuListener {


	__onMenuHide = (id: string) => {
		if (this.props.id !== id)
			return

		this.close()
	};

	__onMenuDisplay = () => {
		// this is triggered by this.open so dont want to make it recursive
	};

	ref = React.createRef<HTMLImageElement>();

	render() {
		return <div className={'clickable'} onClick={this.open} style={{position: "relative", padding: 10}}>
			<img
				ref={this.ref}
				src={this.props.iconClosed}
				onMouseOver={e => e.currentTarget.src = this.props.iconOpen}
				onMouseOut={e => e.currentTarget.src = this.props.iconClosed}
				alt={"openMenu"}/>
		</div>
	}

	setImage = (image: string) => {
		const img = this.ref.current;
		if (!img)
			return

		img.src = image;
		return img
	}

	close = () => {
		this.setImage(this.props.iconClosed)
	}

	open = () => {
		const img = this.setImage(this.props.iconOpen)
		if (!img)
			return

		new MenuBuilder(this.props.menu, resolveRealPosition(img))
			.setId(this.props.id)
			.show()
	}
}