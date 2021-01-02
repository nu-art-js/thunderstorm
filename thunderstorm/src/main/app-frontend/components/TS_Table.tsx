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
import {CSSProperties} from "react";
import {Stylable} from "../tools/Stylable";
import React = require("react");

type HeaderRenderer<T extends ObjectTS> = {
	[P in keyof T]: (columnKey: P) => React.ReactNode
};

type ActionItemRenderer<P> = (rowIndex: number, actionKey: P) => React.ReactNode;
type ActionsRenderer<A extends ObjectTS> = {
	[P in keyof A]: ActionItemRenderer<P>
};

type CellRenderer<P, V> = (cellValue: V, rowIndex: number, columnKey: P) => React.ReactNode;
type RowRenderer<T extends ObjectTS> = {
	[P in keyof T]: CellRenderer<P, T[P]>
};

type TableProps<T extends ObjectTS, A extends ObjectTS = never> = Stylable & {
	id: string,
	header: (keyof T)[],
	rows: T[],
	headerRenderer: (columnKey: keyof T) => React.ReactNode | HeaderRenderer<T>,
	cellRenderer: CellRenderer<keyof T, T[keyof T]> | RowRenderer<T>
	actions?: (keyof A)[],
	actionsRenderer?: ActionsRenderer<A> | ActionItemRenderer<keyof A>
	body?: Stylable
	tr?: Stylable
	td?: Stylable
};

export class TS_Table<T extends ObjectTS, A extends ObjectTS = never>
	extends React.Component<TableProps<T, A>, any> {
	constructor(p: TableProps<T, A>) {
		super(p);
	}

	render() {
		return <table className={this.props.className} style={this.props.style as CSSProperties}>
			<tbody className={this.props.body?.className} style={this.props.body?.style as CSSProperties}>
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
				toRet[headerProp] = this.props.headerRenderer;
				return toRet;
			}, {} as HeaderRenderer<T>);

		return (
			<tr key={`${this.props.id}-0`} className={this.props.tr?.className} style={this.props.tr?.style as CSSProperties}>
				{this.props.header.map(
					(header, index) => <td key={`${this.props.id}-${index}`} className={this.props.td?.className}
					                       style={this.props.td?.style as CSSProperties}>{renderers[header](header)}</td>)}
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
			<tr key={`${this.props.id}-${rowIndex}`} className={this.props.tr?.className} style={this.props.tr?.style as CSSProperties}>
				{this.props.header.map((header, columnIndex) => {
					return <td key={`${this.props.id}-${columnIndex}`} className={this.props.td?.className} style={this.props.td?.style as CSSProperties}>
						{renderers[header](row[header], rowIndex, this.props.header[columnIndex])}
					</td>;
				})}
				{this.props.actions?.map((actionKey, index) => {
					return <td key={`${this.props.id}-${this.props.header.length + index}`} className={this.props.td?.className}
					           style={this.props.td?.style as CSSProperties}>
						{actionsRenderers?.[actionKey](rowIndex, actionKey)}
					</td>;
				})}
			</tr>
		));
	}
}