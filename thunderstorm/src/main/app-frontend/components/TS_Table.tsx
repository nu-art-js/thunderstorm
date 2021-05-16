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

import {ObjectTS} from "@nu-art/ts-common";
import {HTMLProps} from "react";
import {Stylable} from "../tools/Stylable";
import React = require("react");

export type HeaderRenderer<T extends ObjectTS> = {
	[P in keyof Partial<T>]: (columnKey: P) => React.ReactNode
};

export type ActionItemRenderer<P> = (rowIndex: number, actionKey: P) => React.ReactNode;
export type ActionsRenderer<A extends ObjectTS> = {
	[P in keyof A]: ActionItemRenderer<P>
};

export type CellRenderer<P, V> = (cellValue: V, rowIndex: number, columnKey: P) => React.ReactNode;
export type RowRenderer<T extends ObjectTS> = {
	[P in keyof Partial<T>]: CellRenderer<P, T[P]>
};

export type TableProps<T extends ObjectTS, A extends ObjectTS = never> = Stylable & {
	id: string,
	header: (keyof T)[],
	rows: T[],
	headerRenderer: ((columnKey: keyof T) => React.ReactNode) | HeaderRenderer<T>,
	cellRenderer: CellRenderer<keyof T, T[keyof T]> | RowRenderer<T>
	actions?: (keyof A)[],
	actionsRenderer?: ActionsRenderer<A> | ActionItemRenderer<keyof A>
	table?: HTMLProps<HTMLTableElement> | (() => HTMLProps<HTMLTableElement>)
	body?: HTMLProps<HTMLTableSectionElement> | (() => HTMLProps<HTMLTableSectionElement>)
	tr?: HTMLProps<HTMLTableRowElement> | ((rowIndex: number) => HTMLProps<HTMLTableRowElement>)
	td?: HTMLProps<HTMLTableDataCellElement> | ((rowIndex: number, columnKey: keyof T | keyof A) => HTMLProps<HTMLTableDataCellElement>)
};

export class TS_Table<T extends ObjectTS, A extends ObjectTS = never>
	extends React.Component<TableProps<T, A>, any> {
	constructor(p: TableProps<T, A>) {
		super(p);
	}

	render() {
		return <table {...(typeof this.props.table === "function" ? this.props.table() : this.props.table)}>
			<tbody {...(typeof this.props.body === "function" ? this.props.body() : this.props.body)}>
			{this.renderTableHeader()}
			{this.renderTableBody()}
			</tbody>
		</table>;
	}

	private renderTableHeader() {
		let renderers: HeaderRenderer<T>;
		if (typeof this.props.headerRenderer === "object")
			renderers = this.props.headerRenderer;
		else
			renderers = this.props.header.reduce((toRet, headerProp) => {
				toRet[headerProp] = this.props.headerRenderer as ((columnKey: keyof T) => React.ReactNode);
				return toRet;
			}, {} as HeaderRenderer<T>);

		return (
			<tr key={`${this.props.id}-0`} {...(typeof this.props.tr === "function" ? this.props.tr(-1) : this.props.tr)}>
				{this.props.header.map((header, index) => <td
					key={`${this.props.id}-${index}`} {...(typeof this.props.td === "function" ? this.props.td(-1, header) : this.props.td)}>{renderers[header](header)}</td>)}
				{this.props.actions?.map((action, index) => <td key={`${this.props.id}-${this.props.header.length + index}`}/>)}
			</tr>
		);
	}

	private renderTableBody() {
		let renderers: RowRenderer<T>;
		if (typeof this.props.cellRenderer === "object")
			renderers = this.props.cellRenderer;
		else
			renderers = this.props.header.reduce((toRet, headerProp) => {
				toRet[headerProp] = this.props.cellRenderer as CellRenderer<keyof T, T[keyof T]>;
				return toRet;
			}, {} as RowRenderer<T>);

		let actionsRenderers: ActionsRenderer<A> | undefined;
		if (typeof this.props.actionsRenderer === "object")
			actionsRenderers = this.props.actionsRenderer;
		else
			actionsRenderers = this.props.actions?.reduce((toRet, actionKey) => {
				toRet[actionKey] = this.props.actionsRenderer as ActionItemRenderer<keyof A>;
				return toRet;
			}, {} as ActionsRenderer<A>);


		return this.props.rows.map((row, rowIndex) => (
			<tr key={`${this.props.id}-${rowIndex}`} {...(typeof this.props.tr === "function" ? this.props.tr(rowIndex) : this.props.tr)}>
				{this.props.header.map((header, columnIndex) => {
					return <td key={`${this.props.id}-${columnIndex}`} {...(typeof this.props.td === "function" ? this.props.td(rowIndex, header) : this.props.td)}>
						{renderers[header](row[header], rowIndex, this.props.header[columnIndex])}
					</td>;
				})}
				{this.props.actions?.map((actionKey, index) => {
					return <td
						key={`${this.props.id}-${this.props.header.length + index}`} {...(typeof this.props.td === "function" ? this.props.td(rowIndex, actionKey) : this.props.td)}>
						{actionsRenderers?.[actionKey](rowIndex, actionKey)}
					</td>;
				})}
			</tr>
		));
	}
}