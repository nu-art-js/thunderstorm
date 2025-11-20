/*
 * ModuleFE_PDF (ESM-compatible) – PDF.js v4
 * - Directly uses official PDF.js v4 types (no redundant aliases)
 * - Worker configured once at init
 * - Optional TextLayer overlay using v4 `TextLayer` helper
 */

import type {CSSProperties} from 'react';
import {_keys, Module} from '@nu-art/ts-common';

// ---- PDF.js v4 imports ----
// NOTE: The worker import with `?url` works in Vite/Webpack/Rspack. Adjust if your bundler differs.
import * as pdfjsLib from 'pdfjs-dist';
import {PDFDocumentProxy} from 'pdfjs-dist';
import {TextContent} from 'pdfjs-dist/types/src/display/text_layer.js';

const workerUrl = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;


// ---- Engine adapter ----
export interface PDFEngine {
	loadFromBuffer(buffer: ArrayBuffer): Promise<PDFDocumentProxy>;
}

class PDFJSEngine
	implements PDFEngine {
	private _workerSet = false;

	constructor() {
		this.ensureWorker();
	}

	ensureWorker() {
		if (this._workerSet) return;
		(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;
		this._workerSet = true;
	}

	async loadFromBuffer(buffer: ArrayBuffer): Promise<PDFDocumentProxy> {
		this.ensureWorker();
		const task = (pdfjsLib as any).getDocument({data: buffer});
		return (await task.promise) as PDFDocumentProxy;
	}
}

// ---- Module implementation ----
export class ModuleFE_PDF_Class
	extends Module {
	private readonly engine: PDFEngine;

	constructor(engine: PDFEngine = new PDFJSEngine()) {
		super();
		this.engine = engine;
	}

	protected init() {
	}

	appendCanvas(parent: HTMLElement, style?: CSSProperties) {
		const canvas = document.createElement('canvas');
		const _style: CSSProperties = {height: '100%', width: '100%', ...style};
		// @ts-ignore
		_keys(_style).forEach(key => (canvas.style[key as any] = _style[key] as any));
		parent.appendChild(canvas);
		const ctx = canvas.getContext('2d');
		if (!ctx)
			throw new Error('Failed to get 2D context for PDF canvas');
		return ctx;
	}

	appendTextLayer(parent: HTMLElement, style?: CSSProperties) {
		const textLayer = document.createElement('div');
		const _style: CSSProperties = {height: '100%', width: '100%', position: 'absolute', inset: 0, ...style};
		// @ts-ignore
		_keys(_style).forEach(key => (textLayer.style[key as any] = _style[key] as any));
		textLayer.classList.add('pdf-text-layer');
		parent.appendChild(textLayer);
		return textLayer;
	}

	/** Render a 1-based page index. Returns the viewport used. */
	async renderPage(
		canvasContext: CanvasRenderingContext2D,
		pdfFile: PDFDocumentProxy,
		pageNumber: number,
		textLayerDiv?: HTMLDivElement,
		scale = 1
	) {
		if (pageNumber < 1 || pageNumber > pdfFile.numPages)
			throw new Error(`Page ${pageNumber} out of bounds (1..${pdfFile.numPages})`);

		const page: pdfjsLib.PDFPageProxy = await pdfFile.getPage(pageNumber);
		if (!page) {
			this.logError('PDF page is undefined');
			return {width: 0, height: 0} as pdfjsLib.PageViewport;
		}

		const viewport: pdfjsLib.PageViewport = page.getViewport({scale});

		canvasContext.canvas.width = viewport.width;
		canvasContext.canvas.height = viewport.height;

		const renderTask = page.render({
			canvasContext,
			canvas: canvasContext.canvas, // <-- required in v4 types
			viewport
		}) as pdfjsLib.RenderTask;
		await renderTask.promise;

		if (textLayerDiv) {
			const textContentStream: ReadableStream<TextContent> = await page.streamTextContent();
			const layer = new pdfjsLib.TextLayer({
				textContentSource: textContentStream,
				container: textLayerDiv,
				viewport,
			});
			await Promise.resolve((layer as any).render());
		}

		return viewport;
	}

	async loadFromFile(file: File): Promise<PDFDocumentProxy> {
		this.logDebug(`loading pdf from file: ${file.name}`);
		const buffer = await file.arrayBuffer();
		return this.engine.loadFromBuffer(buffer);
	}

	async loadFromUrl(url: string, useFetch = true): Promise<PDFDocumentProxy> {
		this.logDebug(`loading pdf from url: ${url}`);
		const buffer = useFetch ? await this._fetchAsArrayBuffer(url) : await this._xhrArrayBuffer(url);
		return this.engine.loadFromBuffer(buffer);
	}

	async loadFromBuffer(buffer: ArrayBuffer) {
		this.logDebug('loading pdf from ArrayBuffer');
		return this.engine.loadFromBuffer(buffer);
	}

	private async _fetchAsArrayBuffer(url: string): Promise<ArrayBuffer> {
		const res = await fetch(url);
		if (!res.ok)
			throw new Error(`Failed to fetch PDF: ${res.status} ${res.statusText}`);
		return await res.arrayBuffer();
	}

	private async _xhrArrayBuffer(url: string): Promise<ArrayBuffer> {
		return await new Promise<ArrayBuffer>((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.open('GET', url);
			request.responseType = 'arraybuffer';
			request.onerror = () => reject(new Error('XHR network error while fetching PDF'));
			request.onload = () => {
				if (request.status >= 200 && request.status < 300) resolve(request.response);
				else reject(new Error(`XHR failed: ${request.status}`));
			};
			request.send();
		});
	}
}

export const ModuleFE_PDF = new ModuleFE_PDF_Class();
