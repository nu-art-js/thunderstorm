import fs, {promises as _fs} from 'fs';
import {__stringify, Logger} from '@nu-art/ts-common';
import {ScheduledStep} from './PhaseManager.js';


export class RunningStatusHandler
	extends Logger {

	private steps: ScheduledStep[];
	private outputFolder: string;


	constructor(outputFolder: string, steps: ScheduledStep[]) {
		super();
		this.steps = steps;
		this.outputFolder = outputFolder;
	}

	async init() {
		if (!fs.existsSync(this.outputFolder))
			await _fs.mkdir(this.outputFolder, {recursive: true});
	}

	async update(index: number) {
		this.logVerbose(`Setting execution index to #${index}`, this.steps[index]);

		await _fs.writeFile(`${this.outputFolder}/running-status.json`, __stringify({index, steps: this.steps}, true));
	}

	async load() {
		try {
			const data = JSON.parse(await _fs.readFile(`${this.outputFolder}/running-status.json`, {encoding: 'utf-8'}));
			this.steps = data.steps;
			return data.index;
		} catch (e: any) {
			this.logError('Failed reading running status, using initial status', e);
			return;
		}
	}
}