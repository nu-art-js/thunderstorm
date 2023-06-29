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

import {dispatch_onPageTitleChanged} from './AppPageV2';
import {ComponentSync} from './ComponentSync';

// Deprecated use AppPageV2
export abstract class AppPage<P extends { pageTitle?: string | ((state: S) => string) } = {}, S extends {} = {}>
	extends ComponentSync<P, S> {

	private prevTitle!: string;

	protected constructor(p: P) {
		super(p);
		const _componentDidMount = this.componentDidMount?.bind(this);
		this.componentDidMount = () => {
			_componentDidMount?.();

			this.prevTitle = document.title;
			this.updateTitle();
		};

		const _componentWillUnmount = this.componentWillUnmount?.bind(this);
		this.componentWillUnmount = () => {
			_componentWillUnmount?.();

			document.title = this.prevTitle;
		};
	}

	protected updateTitle = () => {
		const newTitle = this.resolveTitle();
		document.title = newTitle;
		this.logDebug(`Mounting page: ${newTitle}`);
		dispatch_onPageTitleChanged.dispatchUI(document.title);
	};

	private resolveTitle = (): string => {
		const pageTitle = this.props.pageTitle;
		if (!pageTitle)
			return '';
		return typeof pageTitle === 'function' ? pageTitle(this.state) : pageTitle;
	};
}