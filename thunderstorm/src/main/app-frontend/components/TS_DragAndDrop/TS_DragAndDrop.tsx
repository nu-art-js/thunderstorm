import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';

type DND_State =
	'Idle' |
	'Dragging' |
	'Positive' |
	'Negative' |
	'PartialNegative';

const DND_Styles: { [K in DND_State]: string } = {
	Idle: 'idle',
	Dragging: 'dragging',
	Positive: 'positive',
	Negative: 'negative',
	PartialNegative: 'partial-negative',
};

export type DND_File = {
	file: File,
	accepted: boolean
}

export type Props_DragAndDrop = {
	id?: string,
	validate: ((files: File[]) => DND_File[]);
	onChange: (files: File[]) => void
}

type State = {
	dndState: DND_State;
}

const timeoutSeconds: number = 2000;

export class TS_DragAndDrop
	extends ComponentSync<Props_DragAndDrop, State> {

	private inputRef = React.createRef<HTMLInputElement>();
	private timers: (ReturnType<typeof setTimeout>)[] = [];

	protected deriveStateFromProps(nextProps: Props_DragAndDrop): State | undefined {
		return {dndState: 'Idle'};
	}

	componentWillUnmount(): void {
		this.timers.forEach(k => clearTimeout(k));
	}

	onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			this.updateFileArray(Object.values(e.target.files));
		}
	};

	static extractContent = (ev: React.DragEvent<HTMLDivElement>): File[] => Object.values(ev.dataTransfer.files);

	extractPayload = (ev: React.DragEvent<HTMLDivElement>) => {
		const files = TS_DragAndDrop.extractContent(ev);

		if (files.length === 0) {
			this.setState({dndState: 'Negative'});
			this.timers.push(setTimeout(() => this.setState({dndState: 'Idle'}), timeoutSeconds));
			return;
		}

		return files;
	};

	static validateFilesBySuffix = (fileExt: string | string[]) =>
		(files: File[]): DND_File[] => {
			const extensions = Array.isArray(fileExt) ? fileExt : [fileExt];
			return files.map((file) => {
				const accepted = extensions.some(ext => RegExp(`.${ext}$`, 'i').test(file.name));
				return {file, accepted};
			},);
		};

	onDrop = (ev: React.DragEvent<HTMLDivElement>): void => {
		ev.preventDefault();

		const files = this.extractPayload(ev);
		files && this.updateFileArray(files);

		TS_DragAndDrop.removeDragData(ev);
	};

	updateFileArray = (_files: File[]) => {

		const files = this.props.validate(_files);

		this.props.onChange(files.map(file => file.file));

		this.setState({dndState: 'Idle'});

	};

	onDragOver = (ev: React.DragEvent<HTMLDivElement>): void => {

		ev.preventDefault();

		if (this.state.dndState !== 'Idle')
			return;

		const dndState = (ev.dataTransfer.items && ev.dataTransfer.items.length > 0) ? 'Positive' : 'Negative';
		this.setState({dndState});
	};

	onDragLeave = (ev: React.DragEvent<HTMLDivElement>) => {
		this.setState({dndState: 'Idle'});
	};

	static removeDragData = (ev: React.DragEvent<HTMLDivElement>) => {

		if (ev.dataTransfer.items) {
			// Use DataTransferItemList interface to remove the drag data
			ev.dataTransfer.items.clear();
		} else {
			// Use DataTransfer interface to remove the drag data
			ev.dataTransfer.clearData();
		}
	};

	render() {
		return (
			<div id={this.props && this.props.id}
					 className={`ts-drag-and-drop__${DND_Styles[this.state.dndState]}`}
					 onDrop={this.onDrop}
					 onDragOver={this.onDragOver}
					 onDragLeave={this.onDragLeave}
					 onClick={() => (this.inputRef.current && this.inputRef.current.click())}>
				<input id="fileInput" type="file" ref={this.inputRef} hidden={true} multiple onChange={this.onSelect}/>
			</div>
		);
	}
}
