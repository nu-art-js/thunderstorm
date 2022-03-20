/*
 * ts-common is the basic building blocks of our typescript projects
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

import {ObjectTS} from '../utils/types';

export type CSVProps<T extends ObjectTS = ObjectTS> = {
	decimalSeparator?: string,
	withHeaders?: boolean,
	fieldWrapper?: string,
	lineSeparator?: string,
	fieldSeparator?: string,
	columnNames?: ((key: keyof T) => string),
	columns: (keyof T)[]
}

export function csvSerializer<T extends ObjectTS = ObjectTS>(items: T[], _csvProps: CSVProps<T>) {
	const csvProps: Required<CSVProps<T>> = {
		decimalSeparator: '.',
		withHeaders: true,
		fieldWrapper: '"',
		lineSeparator: '\n',
		fieldSeparator: ',',
		columnNames: (k) => k.toString(),
		..._csvProps
	};

	function processValue(value: string | number) {
		let escapedValue = (value.toString() || '').replace(csvProps.fieldWrapper, `\\${csvProps.fieldWrapper}`);
		if (escapedValue.includes(csvProps.lineSeparator) || escapedValue.includes(csvProps.fieldSeparator))
			escapedValue = `${csvProps.fieldWrapper}${escapedValue}${csvProps.fieldWrapper}`;

		return `${escapedValue}${csvProps.fieldSeparator}`;
	}

	const outputRows = [];
	const columnsByOrder = csvProps.columns.map(c => c.toString());
	const headersLine = columnsByOrder.reduce((output, header) => `${output}${processValue(csvProps.columnNames(header))}`, '').slice(0, -1);

	if (csvProps.withHeaders)
		outputRows.push(headersLine);

	const rowsData = items.map((row) => columnsByOrder.reduce((output, header) => `${output}${processValue(row[header])}`, '').slice(0, -1));
	outputRows.push(...rowsData);

	return outputRows.reduce((content, row) => `${content}${row}${csvProps.lineSeparator}`, '').slice(0, -1);
}

