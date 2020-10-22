import * as React from "react";
import {ReactNode} from "react";

type RadioProps<T> = {
	id: string
	value: T
	checked: boolean
	onCheck?: (value: T) => void
	label: ReactNode | ((checked: boolean, disabled: boolean) => ReactNode)
	circle?: boolean
	rtl?: boolean
	disabled?: boolean
	buttonClass?:(checked: boolean, disabled: boolean) => string
	containerClass?: (checked: boolean, disabled: boolean) => string
	innerNode?: (checked: boolean, disabled: boolean) => ReactNode
}

export class TS_Checkbox<T>
	extends React.Component<RadioProps<T>> {

	render() {
		const defaultButtonStyle: React.CSSProperties = {
			borderRadius: this.props.circle ? "50%" : "1px",
			border: "1px solid #68678d50",
			boxShadow: "0px 0 1px 0px #867979",
			marginRight: this.props.rtl ? 'unset' : 10,
			marginLeft: this.props.rtl ? 10 : 'unset',
		};

		const radioContainer: React.CSSProperties = {
			cursor: !this.props.disabled && this.props.onCheck ? "pointer" : "inherit"
		};

		const btnInner: React.CSSProperties = {
			width: 15,
			height: 15,
			borderRadius: this.props.circle ? "50%" : "1px",
			boxSizing: "border-box"
		};

		if (this.props.checked) {
			btnInner.border = "4.5px #3499fe solid";
			if (!this.props.circle) btnInner.background = "#3499fe";
		}

		return <div className={`${this.props.containerClass && this.props.containerClass(this.props.checked, !!this.props.disabled)} ll_h_c`} style={radioContainer} id={this.props.id} onClick={() => !this.props.disabled && this.props.onCheck && this.props.onCheck(this.props.value)}>
			{this.props.rtl && this.renderLabel()}
			<div style={this.props.buttonClass ? {} : defaultButtonStyle} className={this.props.buttonClass && this.props.buttonClass(this.props.checked, !!this.props.disabled)}>
				{this.props.innerNode ? this.props.innerNode(this.props.checked, !!this.props.disabled) :<div style={btnInner}/>}
			</div>
			{!this.props.rtl && this.renderLabel()}
		</div>
	}

	renderLabel = () => <div>{typeof this.props.label === "function" ? this.props.label(this.props.checked, !!this.props.disabled) : this.props.label}</div>
}