import React, {Component} from 'react';
import {css} from 'emotion'
const DND_State = {
	Idle: "idle",
	Positive: "positive",
	Negative: "negative",
};

const dragAndDropIn = css`
  margin: auto;
  display: inline-block;
`;

const idleStyle = css({
	display: "flex",
	alignItems: "center",
	minWidth: "100px",
	minHeight: "100px",
	padding: "20px",
	backgroundColor: "#eeeeee",
	boxShadow: "0 0 0 1px rgba(41, 41, 41, 0.2) inset",
	borderRadius: "40px !important",
	label: "drag-and-drop-container"
});

class DragAndDrop
	extends Component {

	constructor(props) {
		super(props);
		this.state = {dndState: DND_State.Idle};

		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);

		const _props = this.props || {};
		this.validateContent = _props.validateContent || (() => true);
		this.idleStyle = _props.idleStyle || idleStyle;
		this.positiveStyle = _props.positiveStyle || idleStyle;
		this.negativeStyle = _props.negativeStyle || idleStyle;
		this._onDrop = _props.onDrop
			|| ((files) => files.forEach((file, index) => console.log(`file name[${index}] = ${file.name}`)));
	}

	static extractContent(ev) {
		let items = ev.dataTransfer.items;
		let files;
		if (items) {
			files = [];
			for (let i = 0; i < items.length; i++) {
				files.push(items[i]);
			}

			files = files.filter(item => item.kind === 'file').map(item => {
				const asFile = item.getAsFile();
				return asFile ? asFile : item;
			});
		} else {
			files = ev.dataTransfer.files;
		}
		return files;
	}

	onDrop(ev) {
		ev.preventDefault();

		let files = this.extractPayload(ev);
		if (files)
			this._onDrop(files, this.props.id);

		this.setState(() => {
			return {
				dndState: DND_State.Idle
			};
		});

		DragAndDrop.removeDragData(ev);
	}

	extractPayload(ev) {
		const files = DragAndDrop.extractContent(ev);
		if (!this.props.validateContent)
			return;

		if (files.length === 0 || !this.props.validateContent(files, this.props.id))
			return;

		return files;
	}

	onDragOver(ev) {
		ev.preventDefault();

		let dndState = this.state.dndState;
		if (this.state.dndState !== DND_State.Idle)
			return;

		dndState = this.extractPayload(ev) ? DND_State.Positive : DND_State.Negative;
		this.setState(() => {
			return {
				dndState: dndState
			};
		});
	}

	onDragLeave(ev) {
		console.log("onDragLeave");

		this.setState(() => {
			return {
				dndState: "idle"
			};
		});
	}

	static removeDragData(ev) {
		// console.log('Removing drag data')

		if (ev.dataTransfer.items) {
			// Use DataTransferItemList interface to remove the drag data
			ev.dataTransfer.items.clear();
		} else {
			// Use DataTransfer interface to remove the drag data
			ev.dataTransfer.clearData();
		}
	}

	render() {
		let style;
		switch (this.state.dndState) {
			case DND_State.Idle:
				style = this.idleStyle;
				break;

			case DND_State.Positive:
				style = this.positiveStyle;
				break;

			case DND_State.Negative:
				style = this.negativeStyle;
				break;

			default:
				throw new Error(`WRONG STATE: ${this.state.dndState}`);
				break;

		}

		return (
			<div id={this.props && this.props.id} className={style}
					 onDrop={this.onDrop.bind(this)}
					 onDragOver={this.onDragOver}
					 onDragLeave={this.onDragLeave}
			>
				<div className={dragAndDropIn}>
					{this.props.children}
				</div>
			</div>
		);
	}
}

export default DragAndDrop;
