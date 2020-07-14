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
import {Filter} from "@nu-art/ts-common/utils/filter-tools";
import {TS_Input} from "./TS_Input";

type Props<T> = {
	filter: (item: T) => string[],
	list: T[],
	onChange: (items: T[], filterTextLength?: number) => void,
	id?: string,
	initialFilterText?: string,
	focus?: boolean,
	inputStyle?: React.CSSProperties,
	className?: string,
	placeholder?: string
}

type State = {}

export class FilterInput<T>
	extends React.Component<Props<T>, State> {
	private filterInstance: Filter;

	constructor(props: Props<T>) {
		super(props);

		this.filterInstance = new Filter();
		this.filterInstance.setFilter(props.initialFilterText || '');
		this.state = {};
	}

	componentDidMount() {
		this.callOnChange(this.props.list);
	}

	shouldComponentUpdate(nextProps: Readonly<Props<T>>, nextState: Readonly<State>, nextContext: any): boolean {
		const b = this.props.list !== nextProps.list;
		if (b)
			this.callOnChange(nextProps.list);

		return b;
	}

	callOnChange = (list: T[], filterTextLength?:number) => {
		const {filter, onChange} = this.props;
		onChange(this.filterInstance.filter(list, filter), filterTextLength);
	};

	filter = (text: string) => {
		this.filterInstance.setFilter(text);
		this.callOnChange(this.props.list, text.length);
	};

	render() {
		const {id, placeholder, inputStyle, className, focus} = this.props;
		return (
			<TS_Input
				type='text'
				id={id}
				value={this.props.initialFilterText}
				onChange={(text) => {
					this.filter(text);
				}}
				focus={focus}
				placeholder={placeholder}
				className={className}
				style={inputStyle}
			/>
		);
	}

}
