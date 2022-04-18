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

import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {Toast_Model, ToastListener, ToastModule} from '../../modules/toaster/ToasterModule';
import {_className} from '../../utils/tools';
import './TS_Toaster.scss';

type State = { model?: Toast_Model };

export type ToastProps = {
	id?: string
}

export class TS_Toaster
	extends ComponentSync<ToastProps, State>
	implements ToastListener {

	protected deriveStateFromProps(nextProps: ToastProps): State | undefined {
		return {model: this.state?.model};
	}

	__showToast = (model?: Toast_Model): void => {
		this.setState({model});

		if (!model)
			return;

		const duration = model.duration;
		if (duration <= 0)
			return;

		setTimeout(() => ToastModule.hideToast(model), duration);
	};

	render() {
		const toast = this.state.model;
		if (!toast?.content)
			return null;

		return this.renderToaster(toast);
	}

	protected renderToaster(toast: Toast_Model): React.ReactNode {
		return (
			<div className={_className('ts-toaster', toast.className)}>
				{toast.content}
			</div>
		);
	}
}