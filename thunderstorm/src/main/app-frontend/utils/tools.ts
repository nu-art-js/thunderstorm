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

export function convertBase64ToFile(fileName: string, base64: string, _mimeType?: string) {
	const arr = base64.split(',');
	const match = arr[0].match(/:(.*?);/);
	const mimeType = (match && match[1]) || (_mimeType && _mimeType);
	if (!mimeType)
		throw new ImplementationMissingException('Could not extract mime type from data...');

	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);

	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}

	return new File([u8arr], fileName, {type: mimeType});
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
