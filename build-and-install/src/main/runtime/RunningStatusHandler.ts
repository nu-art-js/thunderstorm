import fs, {promises as _fs} from 'fs';
import {__stringify, Logger} from '@nu-art/ts-common';
import {BaiParams} from '../params/params.js';


export class RunningStatusHandler
	extends Logger {

	private isolated = false;
	private readonly outputFolder: string;

	// The completed units in the phase.. when running -con, these can be skipped
	private completedUnits: string[] = [];
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

	isolate(): RunningStatusHandler {
		this.isolated = true;
		return this;
	}

	isCompleted(unitKey: string) {
		return this.completedUnits.includes(unitKey);
	}

	async onUnitCompleted(unitKey: string) {
		this.logDebug(`On unit completed: ${unitKey}`);
		this.completedUnits.push(unitKey);
		await this.saveStatus();
	}

	async onStepEnded() {
		this.logDebug(`On step ended successfully #${this.startIndex}`);
		this.completedUnits = [];
	}

	async onStepStarted(index: number) {
		this.startIndex = index;
		this.logDebug(`Setting execution index to #${this.startIndex}`);
		if (this.isolated)
			return;

		await this.saveStatus();
	}

	private async saveStatus() {
		await _fs.writeFile(`${this.outputFolder}/running-status.json`, __stringify({
			index: this.startIndex,
			runtimeParams: this.runtimeParams,
			completedUnits: this.completedUnits
		}, true));
	}

	async load() {
		try {
			const data = JSON.parse(await _fs.readFile(`${this.outputFolder}/running-status.json`, {encoding: 'utf-8'}));
			this.startIndex = data.index;
			this.completedUnits = data.completedUnits ?? [];
			this.runtimeParams = data.runtimeParams;
			return data.index;
		} catch (e: any) {
			this.logError('Failed reading running status, using initial status', e);
			return;
		}
	}
}