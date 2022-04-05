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
// noinspection TypeScriptPreferShortImport
import {Toast_Model, ToastListener, ToastModule} from './ToasterModule';
// noinspection TypeScriptPreferShortImport
import {ComponentSync} from '../../core/ComponentSync';

type State = { model?: Toast_Model };

export type ToastProps = {
	id?: string
}

export abstract class BaseToaster
	extends ComponentSync<ToastProps, State>
	implements ToastListener {

	protected constructor(props: ToastProps) {
		super(props);
		this.state = {};
	}

	__showToast = (model?: Toast_Model): void => {
		this.setState({model});
		if (!model)
			return;

		const duration = model.duration;
		if (duration <= 0)
			return;

		this.debounce(() => ToastModule.hideToast(model), 'closing_action', duration);
	};

	render() {
		const toast = this.state.model;
		if (!toast?.content)
			return null;

		return this.renderToaster(toast);
	}

	renderActions = (toast: Toast_Model) => {
		if (!toast.actions || toast.actions.length === 0)
			return <button onClick={() => ToastModule.hideToast(toast)}>X</button>;

		return <div className={'ll_v_l'}>{React.Children.map(toast.actions, (action, idx) =>
			React.cloneElement(action, {key: idx})
		)}</div>;
	};

	protected abstract renderToaster(toast: Toast_Model): React.ReactNode ;
}





