import {Module} from '@nu-art/ts-common';
import * as Papa from 'papaparse';
import {Transform, TransformCallback} from 'stream';
import {ParseResult} from 'papaparse';
import firebase from 'firebase/compat';
import Error = firebase.auth.Error;

class ModuleBE_CSVParser_Class
	extends Module {

	public getTransform_FromCSV = (config?: Papa.ParseConfig): Transform => new TransformFromCSV(config);

	public getTransform_ToCSV = (config?: Papa.UnparseConfig): Transform => new TransformToCSV(config);
}

export const ModuleBE_CSVParser = new ModuleBE_CSVParser_Class();

class TransformFromCSV
	extends Transform {

	readonly config: Papa.ParseConfig;

	constructor(config?: Papa.ParseConfig) {
		super({objectMode: true});
		this.config = {
			header: true,
			...config
		};
	}

	_transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
		Papa.parse(chunk.toString(), {
			...this.config,
			error: (error: Error) => callback(error),
			complete: (results: ParseResult<any>) => {
				results.data.forEach(row => this.push(row));
				callback();
			}
		});
	}
}

class TransformToCSV
	extends Transform {

	readonly config: Papa.UnparseConfig;
	private firstChunk: boolean;

	constructor(config?: Papa.UnparseConfig) {
		super({objectMode: true});
		this.firstChunk = true;
		this.config = {
			header: true,
			...config,
		};
	}

	_transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
		const data = Array.isArray(chunk) ? chunk : [chunk];
		const parsed = Papa.unparse(data, this.config);
		this.push(parsed);
		if (this.firstChunk) {
			this.firstChunk = false;
			this.config.header = false;
		}
		callback();
	}
}