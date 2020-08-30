/**
 * Created by tacb0ss on 07/05/2018.
 */

import {
	Module,
	ObjectTS,
	StringMap,
} from "@nu-art/ts-common";
import {
	ExportToCsv,
	Options
} from 'export-to-csv';
import {
	createReadStream,
	promises as fs
} from 'fs';
import csvParser = require("csv-parser/index");


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

export type ReadPropsMap<K extends ObjectTS = ObjectTS> = {
	[s: string]: keyof K;
};
export type WritePropsMap<K extends ObjectTS = ObjectTS> = {
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
		return fs.writeFile(outputFile, csv, {encoding: "utf8"});
	}

	async readCsv<T extends Partial<StringMap>>(inputFile: string, columnsToProps?: ReadPropsMap<T>): Promise<T[]> {
		return new Promise<T[]>((resolve, reject) => {
			const results: T[] = [];

			createReadStream(inputFile, {encoding: "utf8"})
				.pipe(csvParser(this.createReadParserOptions(columnsToProps)))
				.on('data', (instance) => {
					delete instance["undefined"]
					results.push(instance);
				})
				.on('error', (err) => reject(err))
				.on('end', () => resolve(results));
		})
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