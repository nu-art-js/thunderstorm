import {CSSProperties} from "react";
import {Module} from '@nu-art/ts-common';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjsworker = require('pdfjs-dist/build/pdf.worker.entry');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjsLib = require("pdfjs-dist/build/pdf.js");

interface PDF_TextContent {
	items: any[];
	styles: any;
}

interface PDF_Viewport {
	height: number
	width: number

	getViewport(scale: number): Promise<PDF_Viewport>
}

export interface PDF_Page {
	_pageInfo: { view: number[] }
	_pageIndex: number

	render(context: { canvasContext: CanvasRenderingContext2D, viewport: PDF_Viewport }): Promise<void>

	getTextContent(): Promise<PDF_TextContent>

	getViewport(scale: { scale: number }): PDF_Viewport
}

export interface PDF_File {
	_pdfInfo: {
		fingerprint: string
		numPages: number
	}

	getPage(pageNumber: number): Promise<PDF_Page>
}

export class ModuleFE_PDF_Class
	extends Module {

	constructor() {
		super();
	}

	protected init() {
		pdfjsLib.disableWorker = true;
		pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsworker;
	}

	appendCanvas(parent: HTMLElement, style?: CSSProperties) {
		const canvas = document.createElement('canvas');
		const _style: CSSProperties = {height: "100%", width: "100%", ...style};
		// @ts-ignore
		_keys(_style).forEach(key => canvas.style[key as any] = _style[key]);
		parent.appendChild(canvas);
		return canvas.getContext("2d") as CanvasRenderingContext2D;
	}

	appendTextLayer(parent: HTMLElement, style?: CSSProperties) {
		const textLayer = document.createElement('div');
		const _style: CSSProperties = {height: "100%", width: "100%", ...style};
		// @ts-ignore
		_keys(_style).forEach(key => textLayer.style[key as any] = _style[key]);

		parent.appendChild(textLayer);
		return textLayer;
	}

	async renderPage(canvasContext: CanvasRenderingContext2D, pdfFile: PDF_File, index: number, textLayer?: HTMLDivElement, scale = 4) {
		const pdfPage = await pdfFile.getPage(index);
		if (!pdfPage) {
			this.logError("cannot render pdf page - undefined");
			// render ERROR on canvas!
			return {width: 500, height: 500};
		}

		const viewport = pdfPage.getViewport({scale});
		canvasContext.canvas.height = viewport.height;
		canvasContext.canvas.width = viewport.width;

		await pdfPage.render({canvasContext, viewport});
		if (textLayer) {
			// const textContent = await pdfPage.getTextContent();
			// textLayer.style.left = canvasContext.canvas.offsetLeft + 'px';
			// textLayer.style.top = canvasContext.canvas.offsetTop + 'px';
			// textLayer.style.height = canvasContext.canvas.offsetHeight + 'px';
			// textLayer.style.width = canvasContext.canvas.offsetWidth + 'px';

			// pdfjsLib.renderTextLayer({
			// 	textContent: textContent,
			// 	container: textLayer,
			// 	viewport: viewport,
			// 	textDivs: []
			// });
		}
		return viewport;
	}

	async loadFromFile(file: File): Promise<PDF_File> {
		this.logDebug(`loading pdf from file: ${file.name}`);
		const pdfFile = await this._loadFromUrl(URL.createObjectURL(file));
		this.logDebug(`loaded pdf from file: ${file.name}`);
		return pdfFile;
	}

	async loadFromUrl(url: string): Promise<PDF_File> {
		this.logDebug(`loading pdf from url: ${url}`);
		const pdfFile = await this._loadFromUrl(url);
		this.logDebug(`loaded pdf from url: ${url}`);
		return pdfFile;
	}

	async loadFromBuffer(buffer: ArrayBuffer) {
		this.logDebug(`loading pdf from ArrayBuffer`);
		const pdfFile = await this._loadFromBuffer(buffer);
		this.logDebug(`loaded pdf from ArrayBuffer`);
		return pdfFile;
	}

	private async _loadFromBuffer(data: ArrayBuffer) {
		const documentLoader = pdfjsLib.getDocument({data});
		return await documentLoader.promise;
	}

	private async _loadFromUrl(url: string) {
		const data = await this._fetchDataFromUrl(url);
		return this._loadFromBuffer(data as ArrayBuffer);
	}


	private async _fetchDataFromUrl(url: string) {
		return new Promise((accept, reject) => {
			const request = new XMLHttpRequest();
			request.open('GET', url);
			request.send(null);
			request.responseType = "arraybuffer";
			request.onerror = reject;
			request.onreadystatechange = () => {
				if (request.readyState === 4 && request.status === 200) {
					accept(request.response);
				}
			};
		});
	}
}

export const ModuleFE_PDF = new ModuleFE_PDF_Class();