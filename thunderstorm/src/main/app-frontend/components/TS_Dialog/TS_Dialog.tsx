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
import {DialogModule} from '../../component-modules/DialogModule';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import {LL_H_C} from '../Layouts';
import {TS_Button} from '../TS_Button';
import './TS_Dialog.scss';


export type DialogButtonModelV2 = {
	content: React.ReactNode;
	associatedKeys: string[];
	action: () => void;
}
type Props<P> = P & { className?: string }
type State<S> = S & { inProgress: boolean }

export abstract class TS_Dialog<P, S = {}>
	extends ComponentSync<Props<P>, State<S>> {

	protected constructor(p: Props<P>) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props<P>) {
		return {inProgress: this.state?.inProgress || false} as unknown as State<S>;
	}

	render() {
		return <div className={_className('ts-dialog', this.props.className)}>
			{this.renderDialog()}
		</div>;
	}

	protected abstract renderDialog(): React.ReactNode;

	protected renderButtons(...buttons: DialogButtonModelV2[]): React.ReactNode {
		return <LL_H_C
			className="ts-dialog__buttons"
			tabIndex={-1}
			onKeyDown={event => {
				const action = buttons.find(b => b.associatedKeys.includes(event.key))?.action;
				action && this.buttonAction(action);
			}}>
			{buttons.map((button, idx) => <TS_Button key={idx} onClick={(e) => this.buttonAction(button.action)}>{button.content}</TS_Button>)}
		</LL_H_C>;
	}

	protected buttonAction(action: () => void) {
		if (this.state.inProgress)
			return;

		action();
	}

	protected dismissDialog = () => {
		DialogModule.close();
	};

	protected ignore = () => {
	};
}
