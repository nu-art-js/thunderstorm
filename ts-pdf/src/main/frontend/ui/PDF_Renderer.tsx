import * as React from 'react';
import './PDF_Renderer.scss';
import {ModuleFE_PDF, PDF_File} from '../modules/ModuleFE_PDF';
import {ComponentAsync, TS_Loader} from '@thunder-storm/core/frontend';
import {_logger_logException} from '@thunder-storm/common';


type State = {
	index: number
	pdfFile?: PDF_File
	width: number
	height: number
}

type Props = {
	pageIndex?: number
	src: string
}

export class PDF_Renderer
	extends ComponentAsync<Props, State> {
	private ctx!: CanvasRenderingContext2D;
	private textLayer!: HTMLDivElement;

	constructor(props: Props) {
		super(props);
	}

	protected async deriveStateFromProps(nextProps: Props) {
		const state = {
			index: nextProps.pageIndex || 1,
			isLoading: false,
			width: 500,
			height: 500
		};

		return state;
	}

	private async loadPdf(pdfSrc: string) {
		this.setState({isLoading: true});
		try {
			const pdfFile: PDF_File = await ModuleFE_PDF.loadFromUrl(pdfSrc);
			this.setState({pdfFile});

			await this.renderPage(this.state.index);

			this.setState({isLoading: false});
		} catch (err: any) {
			this.setState({error: err.message, isLoading: false});
		}
	}

	async componentDidMount() {
		return this.loadPdf(this.props.src);
	}

	async componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
		if (this.props.src !== prevProps.src) {
			return this.loadPdf(this.props.src);
		}
	}

	render() {
		return <>
			<div
				className={'pdf-renderer'}
				ref={instance => {
					if (!instance)
						return;

					if (!this.ctx)
						this.ctx = ModuleFE_PDF.appendCanvas(instance, {position: 'absolute'});

				}}>{this.renderState()}</div>
			<div
				ref={instance => {
					if (!instance)
						return;

					if (!this.textLayer)
						this.textLayer = instance;
				}}/>
		</>;

		// new Array(this.state.pdfFile?._pdfInfo.numPages || 0)
		// 	.fill(0)
		// 	.map((val, index) => <div key={index} className="clickable" style={{margin: "5px", padding: "3px"}}
		// 	                          onClick={async () => {
		// 		                          await this.renderPage(index + 1);
		// 	                          }}>{index + 1}</div>);

	}

	renderState(): React.ReactNode {
		if (this.state.isLoading)
			return <TS_Loader/>;

		if (this.state.error)
			return <div>{_logger_logException(this.state.error)}</div>;
	}

	private async renderPage(index: number) {
		const pdfFile = this.state.pdfFile;
		if (!pdfFile) {
			this.logError('cannot render pdfFile - undefined');
			return;
		}
		this.logInfo(`isLoading page ${index}`);
		const viewport = await ModuleFE_PDF.renderPage(this.ctx, pdfFile, index, this.textLayer);
		this.logInfo(`loaded page ${index}`);

		this.setState({index, width: viewport.width, height: viewport.height});
	}
}