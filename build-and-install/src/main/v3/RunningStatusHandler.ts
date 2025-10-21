import fs, {promises as _fs} from 'fs';
import {__stringify, Logger} from '@nu-art/ts-common';
import {ScheduledStep} from './PhaseManager.js';
import {BaiParams} from '../core/params/params.js';


export class RunningStatusHandler
	extends Logger {
	private isolated = false;
	private steps: ScheduledStep[] = [];
	private outputFolder: string;
	runtimeParams: BaiParams;
	startIndex: number = 0;

	constructor(outputFolder: string, runtimeParams: BaiParams) {
		super();
		this.outputFolder = outputFolder;
		this.runtimeParams = runtimeParams;
	}

	async init() {
		if (!fs.existsSync(this.outputFolder))
			await _fs.mkdir(this.outputFolder, {recursive: true});

		if (this.runtimeParams.continue) {
			const currentParams = this.runtimeParams;
			this.startIndex = await this.load();
			this.runtimeParams = Object.assign(currentParams, this.runtimeParams);
		}
	}

	setSteps(steps: ScheduledStep[]) {
		if (this.runtimeParams.continue)
			return;

		this.steps = steps;
	}

	isolate(): RunningStatusHandler {
		this.isolated = true;
		return this;
	}

	async update(index: number) {
		this.startIndex = index;
		if (this.isolated)
			return;

		this.logVerbose(`Setting execution index to #${index}`, this.steps[index]);
		await _fs.writeFile(`${this.outputFolder}/running-status.json`, __stringify({
			index: this.startIndex,
			runtimeParams: this.runtimeParams,
			steps: this.steps
		}, true));
	}

	async load() {
		try {
			const data = JSON.parse(await _fs.readFile(`${this.outputFolder}/running-status.json`, {encoding: 'utf-8'}));
			this.startIndex = data.index;
			this.steps = data.steps;
			this.runtimeParams = data.runtimeParams;
			return data.index;
		} catch (e: any) {
			this.logError('Failed reading running status, using initial status', e);
			return;
		}
	}
}