import * as React from "react";
import {BaseComponent} from "../../core/BaseComponent";
import {MenuBuilder, Menu} from "./MenuModule";

type Props = {
	id: string
	iconOpen: () => string
	iconClosed: () => string
	menu: Menu<any>
}

export class MenuAndButton
	extends BaseComponent<Props, {}> {

	ref = React.createRef<HTMLImageElement>();

	render() {
		return <div className={'clickable'} onClick={this.open} style={{position: "relative", padding: 10}}>
			<img
				ref={this.ref}
				src={this.props.iconClosed()}
				onMouseOver={e => e.currentTarget.src = this.props.iconOpen()}
				onMouseOut={e => e.currentTarget.src = this.props.iconClosed()}
				alt={"openMenu"}/>
		</div>
	}

	open = () => {
		const img = this.ref.current;
		if (!img)
			return

		img.src = this.props.iconOpen();

		new MenuBuilder(this.props.menu, img)
			.setId(this.props.id)
			.setIconClose(this.props.iconClosed)
			.show()
	}
}