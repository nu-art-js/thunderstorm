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

/**
 * Created by tacb0ss on 07/05/2018.
 */

import {ExportToCsv, Options} from 'export-to-csv';
import {createReadStream, promises as fs} from 'fs';
import {StringMap, TS_Object} from '../utils/types';
import {Module} from '../core/module';
import {Readable} from 'stream';
import csvParser = require('csv-parser');


type Config = {
	options: Options;
};

const DefaultConfig = {
	options: {
		fieldSeparator: ',',
		quoteStrings: '"',
		decimalSeparator: '.',
		showLabels: true,
		showTitle: true,
		title: 'Paired List CSV',
		useTextFile: false,
		useBom: true,
		useKeysAsHeaders: true,
	}
};

export type ReadPropsMap<K extends TS_Object = TS_Object> = {
	[s: string]: keyof K;
};
export type WritePropsMap<K extends TS_Object = TS_Object> = {
	[P in keyof K]: string;
};

class CSVModule_Class
	extends Module<Config> {

	private csvExporter!: ExportToCsv;

	constructor() {
		super();

		this.setDefaultConfig(DefaultConfig);
	}

	protected init() {
		this.csvExporter = CSVModule_Class.createExporter(this.config.options);
	}

	static createExporter(options: Options) {
		return new ExportToCsv(options);
	}

	export<T>(items: T[], returnCsv = true) {
		return this.csvExporter.generateCsv(items, returnCsv);
	}

	async saveToFile<T>(outputFile: string, items: T[], columnsToProps?: WritePropsMap<T>) {
		const csv = this.csvExporter.generateCsv(items, true);
		return fs.writeFile(outputFile, csv, {encoding: 'utf8'});
	}

	async readCsvFromFile<T extends Partial<StringMap>>(inputFile: string, columnsToProps?: ReadPropsMap<T>): Promise<T[]> {
		const stream = createReadStream(inputFile, {encoding: 'utf8'});
		return this.readCsvFromStream(stream, columnsToProps);
	}

	async readCsvFromBuffer<T extends Partial<StringMap>>(buffer: Buffer, columnsToProps?: ReadPropsMap<T>): Promise<T[]> {
		const stream: Readable = Readable.from(buffer.toString('utf-8'), {encoding: 'utf8'});
		return this.readCsvFromStream(stream, columnsToProps);
	}

	async readCsvFromStream<T extends Partial<StringMap>>(stream: Readable, columnsToProps?: ReadPropsMap<T>): Promise<T[]> {
		return new Promise<T[]>((resolve, reject) => {
			const results: T[] = [];

			stream
				.pipe(csvParser(this.createReadParserOptions(columnsToProps)))
				.on('data', (instance) => {
					delete instance['undefined'];
					results.push(instance);
				})
				.on('error', (err) => reject(err))
				.on('end', () => resolve(results));
		});
	}

	private createReadParserOptions<T>(columnsToProps?: ReadPropsMap<T>) {
		return {
			mapHeaders: (args: { header: string }) => {
				return columnsToProps?.[args.header] as string || args.header;
			}
		};
	}
}

export const CSVModule = new CSVModule_Class();