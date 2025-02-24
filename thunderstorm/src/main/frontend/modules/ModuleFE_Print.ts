import {Module, Second, ThisShouldNotHappenException, TypedKeyValue} from '@nu-art/ts-common';
import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

class ModuleFE_Print_Class
	extends Module {

	//######################### Public #########################

	async printNode(node: React.ReactNode, bodyAttributes: TypedKeyValue<string, string>[] = this.defaultBodyAttributes()) {
		return new Promise<void>((resolve, reject) => {
			try {
				const printFrame = this.generatePrintFrame(resolve, bodyAttributes);
				this.insertNode(printFrame, node);
				this.openPrint(printFrame);
			} catch (err: any) {
				this.logError('Failed printing node', err);
				reject();
			}
		});
	}

	async printElement(div: HTMLDivElement, bodyAttributes: TypedKeyValue<string, string>[] = this.defaultBodyAttributes()) {
		return new Promise<void>((resolve, reject) => {
			const themeValue = document.body.getAttribute('theme');
			if (themeValue)
				(bodyAttributes || (bodyAttributes = [])).push({key: 'theme', value: themeValue});

			try {
				const printFrame = this.generatePrintFrame(resolve, bodyAttributes);
				this.insertElement(printFrame, div);
				this.openPrint(printFrame);
			} catch (err: any) {
				this.logError('Failed printing element', err);
				reject();
			}
		});
	}

	//######################### Internal Logic #########################

	private generatePrintFrame = (resolve: VoidFunction, bodyAttributes?: TypedKeyValue<string, string>[]) => {
		const body = document.getElementsByTagName('body')[0];
		const printFrame = this.frameGeneration_GetFrame(body);
		const printWindow = printFrame.contentWindow;
		if (!printWindow)
			throw new ThisShouldNotHappenException('Printing frame has no content window');

		//clone frame head
		this.frameGeneration_CloneHead(printWindow);

		//Set body attributes
		this.frameGeneration_SetBodyAttributes(printWindow, bodyAttributes);

		//Set listener for print frame to resolve the promise after closing
		printWindow.addEventListener('afterprint', () => {
			body.removeChild(printFrame);
			resolve();
		}, {once: true});

		return printFrame;
	};

	private insertElement = (printFrame: HTMLIFrameElement, element: HTMLElement) => {
		const printWindow = printFrame.contentWindow;
		if (!printWindow)
			throw new ThisShouldNotHappenException('Printing frame has no content window');

		//Insert cloned element in body
		const toAppend = element.cloneNode(true);
		const body = printWindow.document.body;
		body.appendChild(toAppend);

		//Close document to editing
		printWindow.document.close();
	};

	private insertNode = (printFrame: HTMLIFrameElement, node: React.ReactNode) => {
		const printWindow = printFrame.contentWindow;
		if (!printWindow)
			throw new ThisShouldNotHappenException('Printing frame has no content window');

		const markup = ReactDOMServer.renderToStaticMarkup(node);
		const body = printWindow.document.body;
		body.innerHTML = markup;

		//Close document to editing
		printWindow.document.close();
	};

	private openPrint = (printFrame: HTMLIFrameElement) => {
		const printWindow = printFrame.contentWindow;
		if (!printWindow)
			throw new ThisShouldNotHappenException('Printing frame has no content window');

		printWindow.focus();
		setTimeout(async () => printWindow.print(), 1.5 * Second);
	};

	private defaultBodyAttributes = (): TypedKeyValue<string, string>[] => {
		const _attributes = document.body.attributes;
		const attributes: TypedKeyValue<string, string>[] = [];
		for (let i = 0; i < _attributes.length; i++) {
			const att = _attributes[i];
			attributes.push({key: att.name, value: att.value});
		}
		return attributes;
	};

	//######################### Frame Generation Logic #########################

	private frameGeneration_GetFrame = (body: HTMLBodyElement) => {
		const printFrame = document.createElement('iframe');
		//Set print frame dimensions
		printFrame.style.width = '0';
		printFrame.style.height = '0';
		printFrame.style.position = 'absolute';
		//Append print frame to the body
		body.appendChild(printFrame);
		return printFrame;
	};

	private frameGeneration_CloneHead = (printWindow: Window) => {
		const newHead = window.document.head.cloneNode(true);
		const currentHead = printWindow.document.head;
		const printHtml = printWindow.document.getElementsByTagName('html')[0];
		printHtml.replaceChild(newHead, currentHead);
	};

	private frameGeneration_SetBodyAttributes = (printWindow: Window, bodyAttributes?: TypedKeyValue<string, string>[]) => {
		if (!bodyAttributes?.length)
			return;

		const body = printWindow.document.body;
		//Add body attributes
		bodyAttributes.forEach(att => {
			body.setAttribute(att.key, att.value);
		});
	};
}

export const ModuleFE_Print = new ModuleFE_Print_Class();