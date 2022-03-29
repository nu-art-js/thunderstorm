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

import {ObjectTS} from '@nu-art/ts-common';
import {HTMLProps} from 'react';
import {Stylable} from '../tools/Stylable';
import React = require('react');

export type TableHeaders<R extends ObjectTS, A extends string = never, P extends ((keyof R) | A) = ((keyof R) | A)> = P[];
export type HeaderRenderer<R extends ObjectTS, A extends string = never, P extends ((keyof R) | A) = ((keyof R) | A)> = {
	[C in P]?: (columnKey: C) => React.ReactNode;
};
export type CellRenderer<R extends ObjectTS, A extends string = never, P extends keyof R | A = ((keyof R) | A)> = (prop: P, item: R, index: number) => React.ReactNode;
export type RowRenderer<R extends ObjectTS, A extends string = never, P extends ((keyof R) | A) = ((keyof R) | A)> = {
	[C in P]?: CellRenderer<R, A, C>;
};
export type TableProps<R extends ObjectTS, A extends string = never, P extends ((keyof R) | A) = ((keyof R) | A)> = Stylable & {
	id: string;
	header: TableHeaders<R, A, P>;
	rows: R[];
	headerRenderer?: ((columnKey: P) => React.ReactNode) | HeaderRenderer<R, A, P>;
	cellRenderer: CellRenderer<R, A, P> | RowRenderer<R, A, P>;
	table?: HTMLProps<HTMLTableElement> | (() => HTMLProps<HTMLTableElement>);
	body?: HTMLProps<HTMLTableSectionElement> | (() => HTMLProps<HTMLTableSectionElement>);
	tr?: HTMLProps<HTMLTableRowElement> | ((row: R | undefined, rowIndex: number) => HTMLProps<HTMLTableRowElement>);
	td?: HTMLProps<HTMLTableDataCellElement> | ((row: R | undefined, rowIndex: number, columnKey: P) => HTMLProps<HTMLTableDataCellElement>);
};


export class TS_Table<R extends ObjectTS, A extends string = never>
	extends React.Component<TableProps<R, A>, any> {
	static defaultProps = {
		actionHeaderRenderer: (action: any) => <div>{action}</div>
	};

	constructor(p: TableProps<R, A>) {
		super(p);
	}

	render() {
		return <table style={{width:'100%'}} {...(typeof this.props.table === 'function' ? this.props.table() : this.props.table)}>
			<tbody {...(typeof this.props.body === 'function' ? this.props.body() : this.props.body)}>
			{this.renderTableHeader()}
			{this.renderTableBody()}
			</tbody>
		</table>;
	}

	private renderTableHeader() {
		if (!this.props.headerRenderer)
			return;

		let renderers: HeaderRenderer<R, A>;
		if (typeof this.props.headerRenderer === 'object')
			renderers = this.props.headerRenderer;
		else
			renderers = this.props.header.reduce((toRet, headerProp) => {
				toRet[headerProp] = this.props.headerRenderer as ((columnKey: keyof R) => React.ReactNode);
				return toRet;
			}, {} as HeaderRenderer<R, A>);

		return (
			<tr key={`${this.props.id}-0`} {...(typeof this.props.tr === 'function' ? this.props.tr(undefined, -1) : this.props.tr)}>
				{this.props.header.map((header, index) => <td
					key={`${this.props.id}-${index}`} {...(typeof this.props.td === 'function' ? this.props.td(undefined, -1, header) : this.props.td)}>{renderers[header]?.(header as any)}</td>)}
			</tr>
		);
	}

	private renderTableBody() {
		let renderers: RowRenderer<R, A>;
		if (typeof this.props.cellRenderer === 'object')
			renderers = this.props.cellRenderer;
		else
			renderers = this.props.header.reduce((toRet, headerProp) => {
				toRet[headerProp] = this.props.cellRenderer as CellRenderer<R, A>;
				return toRet;
			}, {} as RowRenderer<R, A>);

		return this.props.rows.map((row, rowIndex) => (
			<tr key={`${this.props.id}-${rowIndex}`} {...(typeof this.props.tr === 'function' ? this.props.tr(row, rowIndex) : this.props.tr)}>
				{this.props.header.map((header, columnIndex) => {
					return <td key={`${this.props.id}-${columnIndex}`} {...(typeof this.props.td === 'function' ? this.props.td(row, rowIndex, header) : this.props.td)}>
						{renderers[header]?.(header as any, row, rowIndex)}
					</td>;
				})}
			</tr>
		));
	}
}
