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

import {TS_Object} from '../utils/types.js';


/**
 * Configuration options for CSV serialization.
 *
 * @template T - Object type being serialized
 */
export type CSVProps<T extends TS_Object = TS_Object> = {
	/** Decimal separator for numbers (default: '.') */
	decimalSeparator?: string,
	/** Whether to include header row (default: true) */
	withHeaders?: boolean,
	/** Character to wrap fields containing special characters (default: '"') */
	fieldWrapper?: string,
	/** Line separator character (default: '\n') */
	lineSeparator?: string,
	/** Field separator character (default: ',') */
	fieldSeparator?: string,
	/** Function to map column keys to header names (default: key.toString()) */
	columnNames?: ((key: keyof T) => string),
	/** Array of column keys to include, in order */
	columns: (keyof T)[]
}

/**
 * Serializes an array of objects to CSV string format.
 *
 * **Features**:
 * - Customizable separators and wrappers
 * - Automatic field escaping (wraps fields containing separators or line breaks)
 * - Column ordering via `columns` array
 * - Optional header row
 *
 * **Escaping**: Fields containing the field separator or line separator are wrapped
 * in the field wrapper character. Field wrapper characters in values are escaped with backslash.
 *
 * @template T - Object type
 * @param items - Array of objects to serialize
 * @param _csvProps - CSV configuration options
 * @returns CSV string
 */
export function csvSerializer<T extends TS_Object = TS_Object>(items: T[], _csvProps: CSVProps<T>) {
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

