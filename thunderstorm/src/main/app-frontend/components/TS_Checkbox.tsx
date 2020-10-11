import * as React from "react";
import {ReactNode} from "react";

type RadioProps<T> = {
	id: string
	value: T
	checked: boolean
	onCheck?: (value: T) => void
	label: ReactNode
	buttonStyle?: string
	containerStyle?: string
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
			marginRight: "10px",

		};

		// const defaultButtonStyle = emotion.css`
		// 	border-radius: 50%;
		// 	border: 1px solid #68678d50;
		// 	box-shadow: 0px 0 1px 0px #867979;
		// 	margin-right: 10px;
		// 	& .btnInner{
		// 		width: 15px;
		// 		height: 15px;
		// 		border-radius: 50%;
		// 		box-sizing: border-box;
		// 	}
		// 	&.checked .btnInner{
		// 			border: 4.5px #3499fe solid;
		// 		}
		// `;

		return <div className={`${this.props.containerStyle} ${radioContainer} ll_h_c`} id={this.props.id} onClick={() => this.props.onCheck && this.props.onCheck(this.props.value)}>
			<div className={`${this.props.buttonStyle || defaultButtonStyle} ${this.props.checked ? 'checked' : 'unchecked'}`}>
				<div className={`btnInner`}/>
			</div>
			<div className={'label'}>{this.props.label}</div>
		</div>
	}
}