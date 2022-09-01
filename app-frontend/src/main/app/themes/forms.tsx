/*
 * A typescript & react boilerplate with api call example
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
import {Component_Form, ComponentSync, FormProps, ModuleFE_Toaster} from '@nu-art/thunderstorm/frontend';
import {deepClone, TS_Object, tsValidateObject} from '@nu-art/ts-common';


type State<T extends TS_Object> = {
	value: Partial<T>,
	showErrors: boolean
};
export type ConfirmationForm<T extends TS_Object> = FormProps<T> & { onCancel: () => void }

class ConfirmationFormWrapper<T extends TS_Object>
	extends ComponentSync<ConfirmationForm<T>, State<T>> {

	protected deriveStateFromProps(nextProps: ConfirmationForm<T>): State<T> {
		return {value: deepClone(this.props.value || {}), showErrors: false};
	}

	render() {
		return <div>
			<Component_Form {...this.props} value={this.state.value} onAccept={this.onAccept} showErrors={this.state.showErrors}/>

			<div className={'ll_h_c'} style={{marginTop: '10px'}}>
				<div onClick={this.onAccept}>Accept</div>
				<div onClick={this.props.onCancel}>Cancel</div>
			</div>
		</div>;
	}

	onAccept = () => {
		try {
			const value = this.state.value as T;
			this.props.validator && tsValidateObject(value, this.props.validator);
			this.props.onAccept(value);
		} catch (e: any) {
			this.setState({showErrors: true});
			ModuleFE_Toaster.toastError(e.message);
		}

		this.props.onAccept(this.state.value as T);
	};
}

export function renderForm<T extends TS_Object>(props: ConfirmationForm<T>) {
	return <ConfirmationFormWrapper {...props}/>;
}
