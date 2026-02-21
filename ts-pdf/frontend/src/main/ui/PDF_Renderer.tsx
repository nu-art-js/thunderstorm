import * as React from 'react';
import './PDF_Renderer.scss';
import {ModuleFE_PDF} from '../modules/ModuleFE_PDF.js';
import {PDF_Loader} from './PDF_Loader.js';
import {PDFDocumentProxy} from 'pdfjs-dist';

type State = {
	index: number;
	pdfFile?: PDFDocumentProxy;
	width: number;
	height: number;
	isLoading?: boolean;
	error?: string;
};

type Props = {
	pageIndex?: number;
	src: string;
};

export class PDF_Renderer
	extends React.Component<Props, State> {

	private ctx!: CanvasRenderingContext2D;
	private textLayer!: HTMLDivElement;

	constructor(props: Props) {
		super(props);
		this.state = {
			index: props.pageIndex ?? 1,
			width: 500,
			height: 500,
		};
	}

	private async loadPdf(pdfSrc: string) {
		this.setState({isLoading: true});
		try {
			const pdfFile = await ModuleFE_PDF.loadFromUrl(pdfSrc);
			this.setState({pdfFile});
			await this.renderPage(this.state.index);
			this.setState({isLoading: false});
		} catch (err: unknown) {
			this.setState({error: err instanceof Error ? err.message : String(err), isLoading: false});
		}
	}

	override componentDidMount() {
		void this.loadPdf(this.props.src);
	}

	override componentDidUpdate(prevProps: Readonly<Props>) {
		if (this.props.src !== prevProps.src)
			void this.loadPdf(this.props.src);
	}

	override render() {
		return <>
			<div
				className="pdf-renderer"
				ref={instance => {
					if (!instance)
						return;
					if (!this.ctx)
						this.ctx = ModuleFE_PDF.appendCanvas(instance, {position: 'absolute'});
				}}
			>
				{this.renderState()}
			</div>
			<div
				ref={instance => {
					if (instance)
						this.textLayer = instance;
				}}
			/>
		</>;
	}

	private renderState(): React.ReactNode {
		if (this.state.isLoading)
			return <PDF_Loader/>;

		if (this.state.error)
			return <div className="pdf-renderer-error">{this.state.error}</div>;

		return null;
	}

	private async renderPage(index: number) {
		const pdfFile = this.state.pdfFile;
		if (!pdfFile) {
			console.warn('PDF_Renderer: cannot render pdfFile - undefined');
			return;
		}
		const viewport = await ModuleFE_PDF.renderPage(this.ctx, pdfFile, index, this.textLayer);
		this.setState({index, width: viewport.width, height: viewport.height});
	}
}
