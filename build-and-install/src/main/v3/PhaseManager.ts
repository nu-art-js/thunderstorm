import {addItemToArray, filterAsync, Logger, removeItemFromArray} from '@nu-art/ts-common';
import {RunningStatusHandler} from './RunningStatusHandler';
import {Phase} from './phase';
import {ProjectUnit} from './units/ProjectUnit';
import {BaseUnit} from './units/BaseUnit';
import {BaiParams, RuntimeParams} from '../core/params/params';
import {PhaseAggregatedException} from '../core/exceptions/PhaseAggregatedException';

export type ScheduledStep = {
	phases: string[];
	units: string[];
};

export type ExecutionStep = {
	phases: Phase<any>[];
	units: BaseUnit<any>[];
};

export class PhaseManager
	extends Logger {
	private readonly outputFolder: string;
	private readonly phases: Phase<any>[];
	private readonly units: BaseUnit[][];
	private runningUnits: BaseUnit[] = [];
	private killed = false;
	private runtimeParams: BaiParams

	constructor(outputFolder: string, phases: Phase<any>[], units: BaseUnit[][],runtimeParams: BaiParams) {
		super();
		this.outputFolder = outputFolder;
		this.phases = phases;
		this.units = units;
		this.runtimeParams = runtimeParams;
	}

	//######################### Initialization #########################

	async calculateExecutionSteps(): Promise<ScheduledStep[]> {
		const steps: ScheduledStep[] = [];

		for (const phase of this.phases) {
			if (phase.filter && !(await phase.filter()))
				continue;

			for (const layer of this.units) {
				let eligibleUnits = layer.filter(u => phase.key in u);

				if (phase.unitFilter)
					eligibleUnits = (await filterAsync(eligibleUnits as BaseUnit[], phase.unitFilter) as ProjectUnit[]);

				if (eligibleUnits.length === 0)
					continue;

				steps.push({
					phases: [phase.key],
					units: eligibleUnits.map(u => u.config.key),
				});
			}
		}

		return steps;
	}

	async execute(_steps: ScheduledStep[]) {
		let startIndex = 0;
		const runningStatus = new RunningStatusHandler(this.outputFolder, _steps);

		if (RuntimeParams.continue)
			startIndex = await runningStatus.load();
		else
			await runningStatus.init();

		this.runningUnits = [];
		for (let i = startIndex; i < _steps.length; i++) {
			if (this.killed)
				break;

			const step = this.mapStep(_steps[i]);
			this.logDebug(`Executing step #${i + 1}/${_steps.length}`);
			this.logVerbose(_steps[i]);

			const errors: Error[] = [];
			let failedStep;
			await Promise.all(
				step.units.map(async (unit) => {
					for (const phase of step.phases) {
						if (this.killed)
							break;

						if (RuntimeParams.dryRun) {
							this.logInfo(`[${phase.key}] - ${unit.config.key}`);
							continue;
						}

						addItemToArray(this.runningUnits, unit);

						try {
							await (unit[phase.method as keyof BaseUnit] as Function).call(unit);
						} catch (error: any) {
							this.logError(`Error executing phase [${phase.key}] on unit [${unit.config.key}]`, error);
							errors.push(error);
							failedStep = step;
							this.killed = true;
							break;
						} finally {
							removeItemFromArray(this.runningUnits, unit);
						}
					}
				})
			);

			await runningStatus.update(i);

			if (failedStep && errors.length)
				throw new PhaseAggregatedException(errors, failedStep);
		}

		this.logInfo('All steps completed.');
	}

	break() {
		this.killed = true;
		return Promise.all(this.runningUnits.map(unit => unit.kill));
	}

	private mapStep(scheduledStep: ScheduledStep): ExecutionStep {
		const mappedPhases = scheduledStep.phases.map(phaseKey => {
			const phase = this.phases.find(p => p.key === phaseKey);
			if (!phase)
				throw new Error(`Phase '${phaseKey}' not found in PhaseManager.phases`);
			return phase;
		});

		const mappedUnits: BaseUnit[] = scheduledStep.units.map(unitKey => {
			for (const layer of this.units) {
				const unit = layer.find(u => u.config.key === unitKey);
				if (unit) return unit;
			}
			throw new Error(`Unit '${unitKey}' not found in PhaseManager.units`);
		});

		return {
			phases: mappedPhases,
			units: mappedUnits
		};
	}
}
