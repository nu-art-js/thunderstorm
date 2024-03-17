/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Browser} from '../../shared/consts';
import {BadImplementationException, filterInstances, ImplementationMissingException} from '@nu-art/ts-common';
import * as React from 'react';
import {DependencyList, Dispatch, EffectCallback, SetStateAction} from 'react';


export function browserType(): Browser {
	if (navigator?.vendor.includes('Google')) {
		return 'chrome';
	}

	throw new BadImplementationException('No matching browser detected');
}

export async function base64ToBlob(imageAsBase64: string) {
	return (await fetch(imageAsBase64)).blob();
}

export function stringToArrayBuffer(stringToConvert: string) {
	return stringToUint8Array(stringToConvert).buffer;
}

export function stringToUint8Array(stringToConvert: string) {
	let n = stringToConvert.length;
	const u8arr = new Uint8Array(n);

	while (n--) {
		u8arr[n] = stringToConvert.charCodeAt(n);
	}
	return u8arr;
}

//data:image/jpeg;base64,<!-- Base64 data -->
export function convertBase64ToFile(fileName: string, base64: string, _mimeType?: string) {
	const arr = base64.split(',');
	const match = arr[0].match(/:(.*?);/);
	const mimeType = (match && match[1]) || (_mimeType && _mimeType);
	if (!mimeType)
		throw new ImplementationMissingException('Could not extract mime type from data...');

	const stringAsBase64 = atob(arr[1]);
	const u8arr = stringToUint8Array(stringAsBase64);

	return new File([u8arr], fileName, {type: mimeType});
}

function readFileContentImpl(file: File, format: 'array-buffer' | 'binary' | 'data-url' | 'string') {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			resolve(reader.result as ArrayBuffer);
		};
		reader.onerror = reject;
		switch (format) {
			case 'array-buffer':
				reader.readAsArrayBuffer(file);
				break;
			case 'binary':
				reader.readAsBinaryString(file);
				break;
			case 'data-url':
				reader.readAsDataURL(file);
				break;
			case 'string':
				reader.readAsText(file);
				break;

		}
	});
}

export async function readFileAs_ArrayBuffer(file: File) {
	return readFileContentImpl(file, 'array-buffer') as Promise<ArrayBuffer>;
}

export const readFileContent = readFileAs_ArrayBuffer;

export async function readFileAs_BinaryString(file: File) {
	return readFileContentImpl(file, 'binary') as Promise<string>;
}

export async function readFileAs_DataURL(file: File) {
	return readFileContentImpl(file, 'data-url') as Promise<string>;
}

export async function readFileAs_Text(file: File) {
	return readFileContentImpl(file, 'string') as Promise<string>;
}

export function _className(...classes: (string | boolean | undefined)[]) {
	return filterInstances(classes.filter(c => !!c)).join(' ');
}

export function HOOK(fc: React.FC, props?: any) {
	return fc(props);
}

export function HOOK_useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>] {
	return React.useState(initialState);
}

export function HOOK_useEffect<S>(effect: EffectCallback, deps?: DependencyList): void {
	return React.useEffect(effect, deps);
}

export const HOOK_useEffectAsync = (action: () => Promise<void>, deps?: DependencyList, destructor?: () => void) => {
	React.useEffect(() => {
		(action)();
		return destructor;
	}, deps);
};

/**
 * Prevents default behaviour and stops propagation
 * @param e MouseEvent | React.MouseEvent | KeyboardEvent | React.KeyboardEvent
 */
export const stopPropagation = (e: MouseEvent | React.MouseEvent | KeyboardEvent | React.KeyboardEvent) => {
	e.preventDefault();
	e.stopPropagation();
};

type MouseClickActions = {
	left?: () => void,
	middle?: () => void,
	right?: () => void,
}

export const mouseEventHandler = (e: React.MouseEvent | MouseEvent, actions: MouseClickActions) => {
	const key: keyof MouseClickActions = e.button === 0 ? 'left' : (e.button === 1 ? 'middle' : 'right');
	return actions[key]?.();
};

export const stringReplacer = (_content: string, _toReplace: string, replacer: (match: string, i: number) => JSX.Element) => {
	const toRet: React.ReactNode[] = [];
	let i: number = 0;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const content = _content.toLowerCase();
		const toReplace = _toReplace.toLowerCase();
		const index = content.indexOf(toReplace);
		if (index === -1) {
			toRet.push(_content);
			return toRet;
		}

		toRet.push(_content.slice(0, index));
		_content = _content.slice(index);
		toRet.push(replacer(_content.slice(0, toReplace.length), i));
		_content = _content.slice(toReplace.length);
		i++;
	}
};