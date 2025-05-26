import {addItemToArray, filterDuplicates, flatArray, Logger, removeItemFromArray, timeCounter} from '@nu-art/ts-common';
import {RunningStatusHandler} from './RunningStatusHandler';
import {Phase} from './phase';
import {BaseUnit} from './units';
import {BaiParams} from '../core/params/params';
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
	private runtimeParams: BaiParams;
	private activeUnits: string[];

	constructor(outputFolder: string, phases: Phase<any>[], units: BaseUnit[][], runtimeParams: BaiParams) {
		super();
		this.outputFolder = outputFolder;
		this.phases = phases;
		this.units = units;
		this.runtimeParams = runtimeParams;
		const allUnits = filterDuplicates(flatArray(units), u => u.config.key);
		const usePackageKeys = this.runtimeParams.usePackage;
		if (!usePackageKeys?.length)
			this.activeUnits = allUnits.map(unit => unit.config.key);
		else {
			const regexMatchers = usePackageKeys.map(filter => new RegExp(`.*?${filter}.*?`, 'i'));
			this.activeUnits = allUnits.filter(unit => regexMatchers.some(matcher => matcher.test(unit.config.key))).map(unit => unit.config.key);
		}
	}

	//######################### Initialization #########################

	async calculateExecutionSteps(): Promise<ScheduledStep[]> {
		const steps: ScheduledStep[] = [];

		for (const phase of this.phases) {
			if (phase.filter && !(await phase.filter(this.runtimeParams)))
				continue;

			for (const layer of this.units) {
				let eligibleUnits = layer.filter(u => phase.key in u && this.activeUnits.includes(u.config.key));

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

		if (this.runtimeParams.continue)
			startIndex = await runningStatus.load();
		else
			await runningStatus.init();

		this.runningUnits = [];
		for (let i = startIndex; i < _steps.length; i++) {
			if (this.killed)
				break;


			const scheduledStep = _steps[i];
			const step = this.mapStep(scheduledStep);
			this.logDebug(`Executing step #${i + 1}/${_steps.length}`);
			this.logVerbose(scheduledStep);

			const errors: Error[] = [];
			let failedStep;
			await Promise.all(
				step.units.map(async (unit) => {
					for (const phase of step.phases) {
						if (this.killed)
							break;

						if (this.runtimeParams.dryRun) {
							this.logInfo(`[${phase.key}] - ${unit.config.key}`);
							continue;
						}

						addItemToArray(this.runningUnits, unit);

						const dtCounter = timeCounter();
						try {
							this.logInfo(`Phase(${phase.name}) - Running - ${unit.config.key}`);
							await (unit[phase.method as keyof BaseUnit] as Function).call(unit);
							let operationDuration = '';
							if (dtCounter.dt() > 1500)
								operationDuration = ` (${dtCounter.format('mm:ss')})`;

							this.logInfo(`Phase(${phase.name}) - Completed${operationDuration} - ${unit.config.key}`);
						} catch (error: any) {
							this.logError(`Phase(${phase.name}) - Error - ${unit.config.key}`, error);
							errors.push(error);
							failedStep = scheduledStep;
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
		return Promise.all(this.runningUnits.map(unit => unit.kill()));
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
