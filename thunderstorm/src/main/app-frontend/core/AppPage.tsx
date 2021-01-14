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

import {BaseComponent} from "./BaseComponent";
import {ThunderDispatcher} from "./thunder-dispatcher";

export interface OnPageTitleChangedListener {
	onPageTitleChanged(title: string): void;
}

export const dispatch_onPageTitleChanged = new ThunderDispatcher<OnPageTitleChangedListener, "onPageTitleChanged">("onPageTitleChanged");


export abstract class AppPage<P, S>
	extends BaseComponent<P, S> {

	private pageTitle: string;
	private prevTitle!: string;
	private mounted: boolean = false;

	protected constructor(p: P, pageTitle?: string) {
		super(p);
		this.pageTitle = pageTitle || document.title;
	}

	setPageTitle(pageTitle: string) {
		this.pageTitle = pageTitle;
		if (this.mounted)
			document.title = this.pageTitle;
	}

	componentDidMount() {
		this.logDebug(`Mounting page: ${this.pageTitle}`);
		this.prevTitle = document.title;
		document.title = this.pageTitle;
		this.mounted = true;
	}

	componentWillUnmount() {
		document.title = this.prevTitle;
		super.componentWillUnmount?.();
	}
}