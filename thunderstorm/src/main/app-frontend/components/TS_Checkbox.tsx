import * as React from "react";
import {ReactNode} from "react";

type RadioProps<T> = {
	id: string
	value: T
	checked: boolean
	onCheck?: (value: T) => void
	label: ReactNode
	buttonClass?: string
	containerClass?: string,
	innerClass?: string
}

const radioContainer: React.CSSProperties = {
	cursor: "pointer"
};

export class TS_Checkbox<T>
	extends React.Component<RadioProps<T>> {

	render() {
		const defaultButtonStyle: React.CSSProperties = {
			borderRadius: "50%",
			border: "1px solid #68678d50",
			boxShadow: "0px 0 1px 0px #867979",
			marginRight: 10,

		};

		const btnInner: React.CSSProperties = {
			width: 15,
			height: 15,
			borderRadius: "50%",
			boxSizing: "border-box"
		};

		if (this.props.checked) {
			btnInner.border = "4.5px #3499fe solid";
		}

		return <div className={`${this.props.containerClass} ${radioContainer} ll_h_c`} id={this.props.id} onClick={() => this.props.onCheck && this.props.onCheck(this.props.value)}>
			<div style={defaultButtonStyle} className={`${this.props.buttonClass} ${this.props.checked ? 'checked' : 'unchecked'}`}>
				<div style={btnInner} className={`btnInner`}/>
			</div>
			<div className={'label'}>{this.props.label}</div>
		</div>
	}
}