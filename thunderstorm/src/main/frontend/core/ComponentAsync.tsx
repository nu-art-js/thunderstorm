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

/**
 * Created by tacb0ss on 28/07/2018.
 */
import {BaseComponent} from './ComponentBase';


export type BaseAsyncState = {
	isLoading?: boolean,
	error?: Error
}

export abstract class ComponentAsync<P = {}, S = {}, State extends BaseAsyncState & S = BaseAsyncState & S>
	extends BaseComponent<P, State> {
	private derivingState = false;
	private pendingProps?: P;

	protected _deriveStateFromProps(nextProps: P): State | undefined {
		if (this.derivingState) {
			this.logVerbose('Scheduling new props', nextProps as {});
			this.pendingProps = nextProps;
			return;
		}

		this.logVerbose('Deriving state from props', nextProps as {});
		this.pendingProps = undefined;
		this.derivingState = true;

		this.deriveStateFromProps(nextProps)
			.then((state) => {
				if (!this.mounted)
					return this.logWarning('Will not set derived state - Component Unmounted');

				this.setState(state, this.reDeriveCompletedCallback);
			})
			.catch(e => {
				this.logError(`error`, e);
				this.setState({error: e}, this.reDeriveCompletedCallback);
			});

		return this.createInitialState(nextProps);
	}

	private reDeriveCompletedCallback = () => {
		this.derivingState = false;
		if (!this.mounted)
			return this.logWarning('Will not trigger pending props - Component Unmounted');

		if (this.pendingProps) {
			this.logVerbose('Triggering pending props');
			this._deriveStateFromProps(this.pendingProps);
		}
	};

	protected async deriveStateFromProps(nextProps: P): Promise<State> {
		return this.createInitialState(nextProps);
	}

	protected createInitialState(nextProps: P) {
		return {isLoading: true} as State;
	}
}

