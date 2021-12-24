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
import {UIComponent} from '../../core/UIComponent';

export type Props_FilterInput<T> = Stylable & {
	mapper: (item: T) => string[],
	filter?: Filter,
	list: T[],
	onChange: (items: T[], filterBy: string, id?: string) => void,
	id: string,
	initialFilterText?: string,
	regexp?: boolean,
	focus?: boolean,
	placeholder?: string
	handleKeyEvent?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

type State = {}

export class TS_FilterInput<T>
	extends UIComponent<Props_FilterInput<T>, State> {

	private filter!: Filter;

	static defaultProps: Partial<Props_FilterInput<any>> = {
		id: generateHex(16),
		regexp: true
	};

	constructor(props: Props_FilterInput<T>) {
		super(props);
		this.callOnChange();
	}

	protected deriveStateFromProps(nextProps: Props_FilterInput<T>): State | undefined {
		let evaluate = false;
		// @ts-ignore
		this.filter = nextProps.filter;

		if (!this.filter)
			this.filter = new Filter();

		if (this.props.initialFilterText !== nextProps.initialFilterText) {
			this.filter.setFilter(nextProps.initialFilterText || '');
			evaluate = true;
		}

		if (this.props.regexp !== nextProps.regexp) {
			this.filter.setRegexp(nextProps.regexp || true);
			evaluate = true;
		}

		if (evaluate)
			this.callOnChange();

		return;
	}

	callOnChange = () => {
		const filteredOptions = this.filter.filter(this.props.list, this.props.mapper);
		this.props.onChange(filteredOptions, this.filter.getFilter(), this.props.id);
	};

	render() {
		const {id, placeholder, focus} = this.props;
		return (
			<TS_Input
				type="text"
				id={id}
				value={this.props.initialFilterText}
				onChange={(filterText) => {
					this.filter.setFilter(filterText);
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
