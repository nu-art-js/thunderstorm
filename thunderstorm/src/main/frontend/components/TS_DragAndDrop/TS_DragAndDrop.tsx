import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_DragAndDrop.scss';
import {LL_V_L, LL_VH_C} from '../Layouts';
import {asArray} from '@nu-art/ts-common';


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
	PartialNegative: 'partial',
};

export type DND_File = {
	file: File,
	accepted: boolean
}

export type Props_DragAndDrop = React.PropsWithChildren<{
	id?: string,
	validate: ((files: File[]) => DND_File[]);
	onChange: (acceptedFiles: File[], rejectedFiles: File[]) => void
	renderer: React.ComponentType<{ acceptedFiles: File[], rejectedFiles: File[] }>
}>

type State = {
	dndState: DND_State;
	acceptedFiles: File[];
	rejectedFiles: File[];
}

const timeoutSeconds: number = 2000;

const DefaultFilesRenderer = (props: { acceptedFiles: File[], rejectedFiles: File[] }) => {
	return <LL_V_L>
		{props.acceptedFiles.map(file => <div style={{color: 'green'}}>{file.name}</div>)}
		{props.rejectedFiles.map(file => <div style={{color: 'red'}}>{file.name}</div>)}
	</LL_V_L>;
};

export class TS_DragAndDrop
	extends ComponentSync<Props_DragAndDrop, State> {

	static defaultProps = {
		renderer: DefaultFilesRenderer
	};
	private inputRef = React.createRef<HTMLInputElement>();
	private timers: (ReturnType<typeof setTimeout>)[] = [];

	protected deriveStateFromProps(nextProps: Props_DragAndDrop): State | undefined {
		return {
			dndState: 'Idle',
			acceptedFiles: [],
			rejectedFiles: [],
		};
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
			const extensions = asArray(fileExt);
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
		const acceptedFiles = files.filter(file => file.accepted).map(file => file.file);
		const rejectedFiles = files.filter(file => !file.accepted).map(file => file.file);

		let resultState: DND_State = 'PartialNegative';

		if (acceptedFiles.length === 0)
			resultState = 'Negative'; // all files rejected
		else if (rejectedFiles.length === 0)
			resultState = 'Positive'; // all files accepted

		this.setState({dndState: resultState, acceptedFiles, rejectedFiles}, () => this.props.onChange(acceptedFiles, rejectedFiles));
	};

	onDragEnter = (ev: React.DragEvent<HTMLDivElement>): void => {
		ev.preventDefault();
		this.setState({dndState: 'Dragging'});
	};

	onDragOver = (ev: React.DragEvent<HTMLDivElement>): void => {

		ev.preventDefault();

		if (this.state.dndState !== 'Idle')
			return;

		const dndState = (ev.dataTransfer.items && ev.dataTransfer.items.length > 0) ? 'Dragging' : 'Negative';
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
		const Renderer = this.props.renderer;
		return (
			<LL_VH_C className={'ts-drag-and-drop'} id={this.props?.id}>
				<div
					className={`ts-drag-and-drop__content ts-drag-and-drop__${DND_Styles[this.state.dndState]}`}
					onDrop={this.onDrop}
					onDragEnter={this.onDragEnter}
					onDragOver={this.onDragOver}
					onDragLeave={this.onDragLeave}
					onClick={this.openFileChooser}>
					<input className="ts-drag-and-drop__input" id="fileInput" type="file" ref={this.inputRef} hidden={true} multiple onChange={this.onSelect}/>
					<Renderer
						acceptedFiles={this.state.acceptedFiles}
						rejectedFiles={this.state.rejectedFiles}/>
				</div>
			</LL_VH_C>
		);
	}

	private openFileChooser = () => {
		this.inputRef.current && this.inputRef.current.click();
	};
}