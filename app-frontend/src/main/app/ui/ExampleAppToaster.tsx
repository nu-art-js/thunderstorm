import * as React from "react";
import * as emotion from "emotion";
import {_marginRight} from "@styles/styles";
import {BaseComponent,
	Toast,
	ToastListener,
	ToastType,
	Toaster
} from "@nu-art/thunder";
export class ExampleAppToaster
	extends BaseComponent<{}, { toast?: Toast }>
	implements ToastListener {
	constructor(props: any) {
		super(props);
		this.state = {toast: undefined};
	}
	showToast = (toast: Toast): void => {
		this.setState({toast: toast});
	};
	private hideToast = () => {
		this.setState({toast: undefined});
	};
	render() {
		const {toast} = this.state;
		if (!toast || !toast.message)
			return null;
		if (typeof toast.message === "string") {
			let message = toast.message;
			message = message.replace(/\n#### (.*?)\n/g, "\n<h4>$1</h4>\n");
			message = message.replace(/\n### (.*?)\n/g, "\n<h3>$1</h3>\n");
			message = message.replace(/\n## (.*?)\n/g, "\n<h2>$1</h2>\n");
			message = message.replace(/\n# (.*?)\n/g, "\n<h1>$1</h1>\n");
			message = message.replace(/(<\/?.*?>)\n/g, "$1");
			message = message.replace(/([^>]?)\n/g, "$1<br/> ");
			const ignore = message.match(/`(.*?)`/g);
			if (ignore && ignore.length > 0)
				message = ignore.reduce((input, toEscape) => {
					const replaceValue = toEscape.substring(1, toEscape.length - 1)
					                             .replace(/([^\\]?)_/g, "$1\\_")
					                             .replace(/([^\\]?)\*/g, "$1\\*");
					return input.replace(toEscape, replaceValue);
				}, message);
			message = message.replace(/([^\\]?)_(.*?)([^\\])_/g, "$1<i>$2$3</i>");
			message = message.replace(/([^\\]?)\*(.*?)([^\\])\*/g, "$1<b>$2$3</b>");
			message = message.replace(/\\_/g, "_");
			message = message.replace(/\\\*/g, "*");
			toast.message = <div dangerouslySetInnerHTML={{__html: message}}/>;
		}
		const getColors = () => {
			if (toast.bgColor)
				return toast.bgColor;
			switch (toast.type) {
				case ToastType.success:
					return (`background-color: #2ee06f;
                        color: white;`);
				case ToastType.error:
					return (`background-color: #ff4436;
                        color: white;`);
				case ToastType.info:
					return (`background-color: #49addb;
                        color: white;`);
			}
			return (`background-color: #e8e8e8;
                        color: black;`);
		};
		const cssClass = emotion.css`{
            ${getColors()}
            min-width: 384px;
          border-radius: 4px;
          box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.28), 1px 2px 4px 0 rgba(0, 0, 0, 0.5);
          // font-size: 11px;
          letter-spacing: -0.18px;
          padding: 8px 15px 10px 19px;
        }`;
		return <Toaster
			id="app-toaster"
			toast={toast}
			cssClass={cssClass}
			onClose={this.hideToast}
			duration={6000}
			actions={<button onClick={this.hideToast}>-</button>}
		/>
	}
}
export const ExampleNode = <div>example toast</div>;