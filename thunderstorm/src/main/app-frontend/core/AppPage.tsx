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
	__onPageTitleChanged(title: string): void;
}

export const dispatch_onPageTitleChanged = new ThunderDispatcher<OnPageTitleChangedListener, "__onPageTitleChanged">("__onPageTitleChanged");
dispatch_onPageTitleChanged.dispatchUI([""])

export abstract class AppPage<P, S>
	extends BaseComponent<P, S> {

	private pageTitle: string;
	private prevTitle!: string;
	private mounted: boolean = false;

	protected constructor(p: P, pageTitle?: string) {
		super(p);
		this.pageTitle = pageTitle || document.title;
		const _componentDidMount = this.componentDidMount;
		this.componentDidMount = () => {
			if (_componentDidMount)
				_componentDidMount();

			this.logDebug(`Mounting page: ${this.pageTitle}`);
			this.prevTitle = document.title;
			this.updateTitle();
			this.mounted = true;
		};

		const _componentWillUnmount = this.componentWillUnmount;
		this.componentWillUnmount = () => {
			if (_componentWillUnmount)
				_componentWillUnmount();

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