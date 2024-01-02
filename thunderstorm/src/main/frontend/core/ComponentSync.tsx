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


export abstract class ComponentSync<P = any, State = any>
	extends BaseComponent<P, State> {

	protected _deriveStateFromProps(nextProps: P, state?: Partial<State>): State | undefined {
		this.logVerbose('Deriving state from props');
		state ??= this.state ? {...this.state} : {} as State;
		const _state = this.deriveStateFromProps(nextProps, state);
		this.mounted && _state && this.setState(_state);
		return _state;
	}

	protected deriveStateFromProps(nextProps: P, state: Partial<State>): State {
		return state as State;
	}
}