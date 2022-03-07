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
import {KeyboardEvent} from 'react';
import {Filter} from '@nu-art/ts-common/utils/filter-tools';
import {TS_Input} from './TS_Input';
import {Stylable} from '../../tools/Stylable';
import {generateHex} from '@nu-art/ts-common';
import {BaseComponent} from '../../core/BaseComponent';

export type Props_FilterInput<T> = Stylable & {
	mapper: (item: T) => string[],
	filter?: Filter,
	list: T[],
	onChange: (items: T[], filterBy: string, id?: string) => void,
	id: string,
	initialFilterText?: string,
	regexp?: boolean,
	focus?: boolean,
	forceFilter?: boolean,
	placeholder?: string
	handleKeyEvent?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

type State = { filter: Filter }

// WIP
export class TS_FilterInputV2<T>
	extends BaseComponent<Props_FilterInput<T>, State> {

	static defaultProps: Partial<Props_FilterInput<any>> = {
		id: generateHex(16),
		forceFilter: false,
		regexp: true
	};

	constructor(props: Props_FilterInput<T>) {
		super(props);
		this.callOnChange();
	}

	protected deriveStateFromProps(nextProps: Props_FilterInput<T>): State | undefined {
		let evaluate = nextProps.forceFilter || false;
		const filter: Filter = this.props.filter !== nextProps.filter && nextProps.filter || this.state.filter || new Filter().setRegexp(nextProps.regexp || true);
		const state: State = {filter};

		if (this.props.initialFilterText !== nextProps.initialFilterText) {
			filter.setFilter(nextProps.initialFilterText || '');
			evaluate = true;
		}

		if (this.props.regexp !== nextProps.regexp) {
			filter.setRegexp(nextProps.regexp || true);
			evaluate = true;
		}

		if (evaluate)
			this.callOnChange?.();

		return state;
	}

	callOnChange = (list: T[] = this.props.list) => {
		const filteredOptions = this.state.filter.filter(list, this.props.mapper);
		this.props.onChange(filteredOptions, this.state.filter.getFilter(), this.props.id);
	};

	render() {
		const {id, placeholder, focus} = this.props;
		return (
			<TS_Input
				type="text"
				id={id}
				value={this.props.initialFilterText}
				onChange={(filterText) => {
					this.state.filter.setFilter(filterText);
					this.callOnChange();
				}}
				focus={focus}
				placeholder={placeholder}
				className={this.props.className}
				style={this.props.style}
				handleKeyEvent={this.props.handleKeyEvent}
			/>
		);
	}

}
