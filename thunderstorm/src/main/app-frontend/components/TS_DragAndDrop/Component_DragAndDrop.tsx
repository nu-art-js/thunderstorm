// import * as React from 'react';
// import * as emotion from 'emotion';
//
// const DND_State = {
// 	Idle: "idle",
// 	Positive: "positive",
// 	Negative: "negative",
// };
//
// const container = emotion.css`
// 	padding: 10px;
// `;
//
// const idleStyle = emotion.css`
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     width: 120px;
//     height: 120px;
//     background-color: #fff;
//     border-radius: 40px !important;
// 		border: 2px dashed #ccc;
//     label: drag-and-drop-container;
// `;
//
// const positiveStyle = emotion.css`
//     ${idleStyle};
//     background-color: #fff;
//     border: 4px dashed #ccc;
// `;
//
// const negativeStyle = emotion.css`
//     ${idleStyle};
//     background-color: #fff;
//     border: 4px dashed red;
// `;
//
// interface IProps {
// 	id?: string,
// 	error?: boolean,
// 	validate: ((files: File[]) => _FilesType) | string[] | string;
// 	idleStyle?: string,
// 	positiveStyle?: string,
// 	negativeStyle?: string,
// 	onChange: (files: _FilesType) => void
// }
//
// export type _FilesType = {
// 	accepted: File[],
// 	rejected: File[],
// 	uploaded: File[]
// }
//
// interface IState {
// 	dndState: string
// }
//
// const timeoutSeconds: number = 2000;
//
// class DragAndDrop
// 	extends React.Component<IProps, IState> {
//
// 	public static defaultProps = {
// 		idleStyle,
// 		positiveStyle,
// 		negativeStyle,
// 	};
//
// 	private inputRef = React.createRef<HTMLInputElement>();
// 	private timers: (ReturnType<typeof setTimeout>)[] = [];
//
// 	state = {dndState: DND_State.Idle};
//
// 	componentWillUnmount(): void {
// 		this.timers.forEach(k => clearTimeout(k));
// 	}
//
// 	onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
// 		if (e.target.files) {
// 			this.updateFileArray(Object.values(e.target.files));
// 		}
// 	};
//
// 	static extractContent = (ev: React.DragEvent<HTMLDivElement>): File[] => Object.values(ev.dataTransfer.files);
//
// 	extractPayload = (ev: React.DragEvent<HTMLDivElement>) => {
// 		const files = DragAndDrop.extractContent(ev);
//
// 		if (files.length === 0) {
// 			this.setState({dndState: DND_State.Negative});
// 			this.timers.push(setTimeout(() => this.setState({dndState: DND_State.Idle}), timeoutSeconds));
// 			return;
// 		}
//
// 		return files;
// 	};
//
// 	validateArray = (files: File[], fileExt: string | string[]): _FilesType => {
// 		const _res: _FilesType = {
// 			accepted: [],
// 			rejected: [],
// 			uploaded: [],
// 		};
//
// 		const extensions = Array.isArray(fileExt) ? fileExt : [fileExt];
//
// 		return files.reduce((res, f) => {
// 			if (extensions.some(ext => RegExp(`.${ext}$`, 'i').test(f.name))) {
// 				res.accepted.push(f);
// 			} else {
// 				res.rejected.push(f);
// 			}
// 			return res;
// 		}, _res);
// 	};
//
// 	onDrop = (ev: React.DragEvent<HTMLDivElement>): void => {
// 		ev.preventDefault();
//
// 		const files = this.extractPayload(ev);
// 		files && this.updateFileArray(files);
//
// 		DragAndDrop.removeDragData(ev);
// 	};
//
// 	updateFileArray = (_files: File[]) => {
//
// 		let files: _FilesType;
// 		if (this.props.validate instanceof Function) {
// 			files = this.props.validate(_files);
// 		} else {
// 			files = this.validateArray(_files, this.props.validate);
// 		}
//
// 		this.props.onChange(files);
//
// 		this.setState({dndState: DND_State.Idle});
//
// 	};
//
// 	onDragOver = (ev: React.DragEvent<HTMLDivElement>): void => {
//
// 		ev.preventDefault();
//
// 		if (this.state.dndState !== DND_State.Idle)
// 			return;
//
// 		const dndState = (ev.dataTransfer.items && ev.dataTransfer.items.length > 0) ? DND_State.Positive : DND_State.Negative;
// 		this.setState({dndState});
// 	};
//
// 	onDragLeave = (ev: React.DragEvent<HTMLDivElement>) => {
// 		this.setState({dndState: DND_State.Idle});
// 	};
//
// 	static removeDragData = (ev: React.DragEvent<HTMLDivElement>) => {
//
// 		if (ev.dataTransfer.items) {
// 			// Use DataTransferItemList interface to remove the drag data
// 			ev.dataTransfer.items.clear();
// 		} else {
// 			// Use DataTransfer interface to remove the drag data
// 			ev.dataTransfer.clearData();
// 		}
// 	};
//
// 	render() {
// 		let style;
// 		switch (this.state.dndState) {
// 			case DND_State.Idle:
// 				style = this.props.idleStyle;
// 				break;
//
// 			case DND_State.Positive:
// 				style = this.props.positiveStyle;
// 				break;
//
// 			case DND_State.Negative:
// 				style = this.props.negativeStyle;
// 				break;
//
// 			default:
// 				throw new Error(`WRONG STATE: ${this.state.dndState}`);
//
// 		}
// 		return (<div className={container}>
// 				<div id={this.props && this.props.id}
// 				     className={style}
// 				     onDrop={this.onDrop}
// 				     onDragOver={this.onDragOver}
// 				     onDragLeave={this.onDragLeave}
// 				     onClick={() => (this.inputRef.current && this.inputRef.current.click())}
// 				>
// 					<input id="fileInput" type="file" ref={this.inputRef} hidden={true} multiple onChange={this.onSelect}/>
// 				</div>
// 			</div>
// 		);
// 	}
// }
//
// export default DragAndDrop;
