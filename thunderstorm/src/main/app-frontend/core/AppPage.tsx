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

import {BaseComponent} from './BaseComponent';
import {ThunderDispatcher} from './thunder-dispatcher';

export interface OnPageTitleChangedListener {
	__onPageTitleChanged(title: string): void;
}

export const dispatch_onPageTitleChanged = new ThunderDispatcher<OnPageTitleChangedListener, '__onPageTitleChanged'>('__onPageTitleChanged');

export abstract class AppPage<P extends {} = {}, S extends {} = {}>
	extends BaseComponent<P, S> {

	private pageTitle: string;
	private prevTitle!: string;

	protected constructor(p: P, pageTitle?: string) {
		super(p);
		this.pageTitle = pageTitle || document.title;
		const _componentDidMount = this.componentDidMount?.bind(this);
		this.componentDidMount = () => {
			_componentDidMount?.();

			this.logDebug(`Mounting page: ${this.pageTitle}`);
			this.prevTitle = document.title;
			this.updateTitle();
		};

		const _componentWillUnmount = this.componentWillUnmount?.bind(this);
		this.componentWillUnmount = () => {
			_componentWillUnmount?.();

			document.title = this.prevTitle;
		};
	}

	setPageTitle(pageTitle: string) {
		this.pageTitle = pageTitle;
		if (this.mounted)
			this.updateTitle();
	}


	private updateTitle() {
		document.title = this.pageTitle;
		dispatch_onPageTitleChanged.dispatchUI([this.pageTitle]);
	}

}