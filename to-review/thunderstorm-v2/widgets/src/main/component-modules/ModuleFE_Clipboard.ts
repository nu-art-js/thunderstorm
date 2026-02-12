import {Module} from '@nu-art/ts-common';
import {ModuleFE_Toaster} from './ModuleFE_Toaster.js';
import {base64ToBlob} from '@nu-art/web-client';


class ModuleFE_Clipboard_Class
	extends Module {
	async copyToClipboard(toCopy: string, customSuccessMessage?: string) {
		try {
			await navigator.clipboard.writeText(toCopy);
			ModuleFE_Toaster.toastInfo(customSuccessMessage ?? `Copied to Clipboard:\n"${toCopy}"`);
		} catch (e) {
			ModuleFE_Toaster.toastError(`Failed to copy to Clipboard:\n"${toCopy}"`);
		}
	}

	async readFileContent(file: File) {
		const fullUrl = URL.createObjectURL(file);
		const response = await fetch(fullUrl);
		const content = await response.text();
		URL.revokeObjectURL(fullUrl);
		return content;
	}

	async writeToClipboard(imageAsBase64: string, contentType = 'image/png') {
		try {
			// const clipboardItem = new ClipboardItem({'image/png': imageAsBase64});
			const clipboardItem = new ClipboardItem({contentType: await base64ToBlob(imageAsBase64)});
			await navigator.clipboard.write([clipboardItem]);

			// TODO: Render Blob in toast
			ModuleFE_Toaster.toastInfo(`Copied image Clipboard`);
		} catch (error) {
			ModuleFE_Toaster.toastError(`Failed to copy image to Clipboard`);
		}
	}

}

export const ModuleFE_Clipboard = new ModuleFE_Clipboard_Class();