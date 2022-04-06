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
import {Stylable} from '../../tools/Stylable';
import React = require('react');
import {_className} from '../../utils/tools';
import './TS_Table.scss';

export type TableHeaders<R extends ObjectTS, A extends string = never, P extends ((keyof R) | A) = ((keyof R) | A)> = P[];
export type HeaderRenderer<R extends ObjectTS, A extends string = never, P extends ((keyof R) | A) = ((keyof R) | A)> = {
	[C in P]?: (columnKey: C) => React.ReactNode;
};
export type CellRenderer<R extends ObjectTS, A extends string = never, P extends keyof R | A = ((keyof R) | A)> = (prop: P, item: R, index: number) => React.ReactNode;
export type RowRenderer<R extends ObjectTS, A extends string = never, P extends ((keyof R) | A) = ((keyof R) | A)> = {
	[C in P]?: CellRenderer<R, A, C>;
};
export type Props_Table<R extends ObjectTS, A extends string = never, P extends ((keyof R) | A) = ((keyof R) | A)> = Stylable & {
	id?: string;
	header: TableHeaders<R, A, P>;
	rows: R[];
	headerRenderer?: ((columnKey: P) => React.ReactNode) | HeaderRenderer<R, A, P>;
	cellRenderer: CellRenderer<R, A, P> | RowRenderer<R, A, P>;
	table?: HTMLProps<HTMLTableElement> | (() => HTMLProps<HTMLTableElement>);
	head?: HTMLProps<HTMLTableSectionElement> | (() => HTMLProps<HTMLTableSectionElement>);
	body?: HTMLProps<HTMLTableSectionElement> | (() => HTMLProps<HTMLTableSectionElement>);
	tr?: HTMLProps<HTMLTableRowElement> | ((row: R | undefined, rowIndex: number) => HTMLProps<HTMLTableRowElement>);
	td?: HTMLProps<HTMLTableDataCellElement> | ((row: R, rowIndex: number, columnKey: P) => HTMLProps<HTMLTableDataCellElement>);
	th?: HTMLProps<HTMLTableHeaderCellElement> | ((columnKey: P) => HTMLProps<HTMLTableHeaderCellElement>);
};


export class TS_Table<R extends ObjectTS, A extends string = never>
	extends React.Component<Props_Table<R, A>, any> {
	static defaultProps = {
		actionHeaderRenderer: (action: any) => <div>{action}</div>
	};

	constructor(p: Props_Table<R, A>) {
		super(p);
	}

	render() {
		const tableProps = typeof this.props.table === 'function' ? this.props.table() : this.props.table;
		const tableBodyProps = typeof this.props.body === 'function' ? this.props.body() : this.props.body;
		const tableHeadProps = typeof this.props.head === 'function' ? this.props.head() : this.props.head;

		return (
			<table id={this.props.id} {...tableProps} className={_className('ts-table', tableProps?.className)}>
				<thead {...tableHeadProps} className={_className('ts-table__head', tableHeadProps?.className)}>
				{this.renderTableHeader()}
				</thead>
				<tbody {...tableBodyProps} className={_className('ts-table__body', tableBodyProps?.className)}>
				{this.renderTableBody()}
				</tbody>
			</table>);
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

		const tablePropsTR = typeof this.props.tr === 'function' ? this.props.tr(undefined, -1) : this.props.tr;
		const classNameTR = _className('ts-table__tr', tablePropsTR?.className);

		return (
			<tr key={`${this.props.id}-0`} {...tablePropsTR} className={classNameTR}>

				{this.props.header.map((header, index) => {
					const tablePropsTH = typeof this.props.th === 'function' ? this.props.th(header) : this.props.th;
					const classNameTH = _className('ts-table__th', tablePropsTH?.className);

					return <th key={`${this.props.id}-${index}`} {...tablePropsTH} className={classNameTH}>
						{renderers[header]?.(header as any)}
					</th>;
				})}

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

		return this.props.rows.map((row, rowIndex) => {
			const tablePropsTR = typeof this.props.tr === 'function' ? this.props.tr(row, rowIndex) : this.props.tr;
			const classNameTR = _className('ts-table__tr', tablePropsTR?.className);

			return (
				<tr key={`${this.props.id}-${rowIndex}`} {...tablePropsTR} className={classNameTR}>
					{this.props.header.map((header, columnIndex) => {
						const tablePropsTD = typeof this.props.td === 'function' ? this.props.td(row, rowIndex, header) : this.props.td;
						const classNameTD = _className('ts-table__td', tablePropsTD?.className);

						return <td
							key={`${this.props.id}-${columnIndex}`} {...tablePropsTD} className={classNameTD}>
							{renderers[header]?.(header as any, row, rowIndex)}
						</td>;
					})}
				</tr>
			);
		});
	}
}

