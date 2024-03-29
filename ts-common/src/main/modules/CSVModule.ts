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
import {Readable, Transform} from 'stream';
import {Queue} from '../utils/queue';
import csvParser = require('csv-parser');
import * as csv from 'fast-csv';


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
export type ReadOptions<T extends Partial<StringMap> = {}> = {
	columnsToProps?: ReadPropsMap<T>,
	mapValues?: (header: string, value: string, index: number) => any,
	quote?: string,
	headers?: string[]
}
export type ReadPropsMap<T extends TS_Object = TS_Object> = {
	[s: string]: keyof T;
};
export type WritePropsMap<T extends TS_Object = TS_Object> = {
	[P in keyof T]: string;
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

	updateExporterSettings(options: Options) {
		this.csvExporter = CSVModule_Class.createExporter(options);
	}

	export<T>(items: T[], returnCsv = true) {
		return this.csvExporter.generateCsv(items, returnCsv);
	}

	async saveToFile<T extends TS_Object>(outputFile: string, items: T[], columnsToProps?: WritePropsMap<T>) {
		const csv = this.csvExporter.generateCsv(items, true);
		return fs.writeFile(outputFile, csv, {encoding: 'utf8'});
	}

	async readCsvFromFile<T extends TS_Object>(inputFile: string, readOptions?: ReadOptions<T>): Promise<T[]> {
		const stream = createReadStream(inputFile, {encoding: 'utf8'});
		return this.readCsvFromStream(stream, readOptions);
	}

	async readCsvFromBuffer<T extends TS_Object>(buffer: Buffer, readOptions?: ReadOptions<T>): Promise<T[]> {
		const stream: Readable = Readable.from(buffer.toString('utf-8'), {encoding: 'utf8'});
		return this.readCsvFromStream(stream, readOptions);
	}

	async readCsvFromStream<T extends TS_Object>(stream: Readable, readOptions: ReadOptions<T> = {}): Promise<T[]> {
		return new Promise<T[]>((resolve, reject) => {
			const results: T[] = [];

			stream
				.pipe(csvParser(this.createReadParserOptions<T>(readOptions)))
				.on('data', (instance) => {
					delete instance['undefined'];
					results.push(instance);
				})
				.on('error', (err) => reject(err))
				.on('end', () => resolve(results));
		});
	}

	async forEachCsvRowFromStreamAsync<T extends TS_Object>(stream: Readable, callback: (instance: T) => Promise<void>, readOptions: ReadOptions = {}, queueCount: number = 5): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const instancesQueue = new Queue('instancesQueue');
			instancesQueue.setParallelCount(queueCount);

			stream
				.pipe(csvParser(this.createReadParserOptions(readOptions)))
				.on('data', (instance) => instancesQueue.addItem(() => callback(instance)))
				.on('error', (err) => reject(err))
				.on('end', () => instancesQueue.setOnQueueEmpty(() => resolve()));
		});
	}

	async forEachCsvRowFromStreamSync<T extends TS_Object>(stream: Readable, callback: (instance: T, index: number, csvStream: Transform) => void, readOptions: ReadOptions = {}): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let rowIndex = 0;
			const csvStream = csvParser(this.createReadParserOptions(readOptions));
			stream
				.pipe(csvStream)
				.on('data', (instance) => callback(instance, rowIndex++, csvStream))
				.on('error', (err) => reject(err))
				.on('end', () => {
					this.logInfo('read ended');
					resolve();
				});
		});
	}

	async forEachCsvRowFromStreamSync_FastCSV<T extends TS_Object>(stream: Readable, callback: (instance: T, index: number, stream: Readable) => void, readOptions: ReadOptions = {}): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let rowIndex = 0;

			const csvStream = csv.parse({headers: true, trim: true});
			csvStream
				.on('data', (instance) => {

					callback(instance, rowIndex++, csvStream);
				})
				.on('error', (err) => reject(err))
				.on('end', () => {
					this.logInfo('read ended');
					resolve();
				});

			stream.pipe(csvStream);
		});
	}

	private createReadParserOptions<T extends TS_Object>(readOptions: ReadOptions<T>) {
		return {
			mapHeaders: (args: { header: string }) => {
				return (readOptions.columnsToProps?.[args.header] ?? args.header) as string;
			},
			mapValues: (args: { header: string, index: number, value: string }) => {
				const mapValues = readOptions.mapValues?.(args.header, args.value, args.index);
				return mapValues ?? args.value;
			},
			quote: readOptions.quote || '"',
			headers: readOptions.headers,

		};
	}
}

export const CSVModule = new CSVModule_Class();