import {addItemToArray, exists, flatArray, Logger, removeItemFromArray, timeCounter, TypedMap} from '@nu-art/ts-common';
import {RunningStatusHandler} from './RunningStatusHandler.js';
import {Phase} from './phase/index.js';
import {BaseUnit} from './units/index.js';
import {BaiParams} from '../core/params/params.js';
import {PhaseAggregatedException} from '../core/exceptions/PhaseAggregatedException.js';

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
	private readonly phases: Phase<any>[][];
	private readonly units: BaseUnit[][];
	private runningUnits: BaseUnit[] = [];
	private killed = false;
	private runtimeParams: BaiParams;
	private activeUnits: string[];
	private readonly keyToPhaseMap: TypedMap<Phase<any>>;

	constructor(outputFolder: string, phases: Phase<any>[][], units: BaseUnit[][], runtimeParams: BaiParams) {
		super();
		this.outputFolder = outputFolder;
		this.phases = phases;
		this.units = units;
		this.runtimeParams = runtimeParams;
		const unitKeySet = new Set<string>();

		const allUnits: BaseUnit[] = [];
		for (const unit of flatArray(units)) {
			if (unitKeySet.has(unit.config.key))
				throw new Error(`Multiple units with same key: ${unit.config.key}`);
			unitKeySet.add(unit.config.key);
			allUnits.push(unit);
		}

		const usePackageKeys = this.runtimeParams.usePackage;
		if (!usePackageKeys?.length)
			this.activeUnits = allUnits.map(unit => unit.config.key);
		else {
			const regexMatchers = usePackageKeys.map(filter => new RegExp(`.*?${filter}.*?`, 'i'));
			this.activeUnits = allUnits.filter(unit => regexMatchers.some(matcher => matcher.test(unit.config.key))).map(unit => unit.config.key);
		}

		this.keyToPhaseMap = flatArray(phases).reduce<TypedMap<Phase<any>>>((acc, phase) => {
			acc[phase.key] = phase;
			return acc;
		}, {});
	}

	//######################### Initialization #########################

	async calculateExecutionSteps(): Promise<ScheduledStep[]> {
		const steps: ScheduledStep[] = [];
		this.logDebug('Calculating execution steps for phases: ', this.phases.map(phases => phases.map(phase => phase.key)));
		this.logDebug('Active Units: ', this.activeUnits);

		for (let phaseGroup of this.phases) {
			phaseGroup = phaseGroup.filter(phase => !exists(phase.filter) || phase.filter(this.runtimeParams));

			for (const layer of this.units) {
				const layerUnits = layer.filter(u => this.activeUnits.includes(u.config.key));
				if (layerUnits.length === 0)
					continue;

				const phaseMap: Map<string, BaseUnit[]> = new Map();

				for (const unit of layerUnits) {
					const supportedPhases = phaseGroup.filter(phase => phase.method in unit);
					if (supportedPhases.length === 0)
						continue;

					const key = phaseGroup
						.filter(phase => supportedPhases.find(p => p.key === phase.key))
						.map(p => p.key)
						.join('|');

					if (!phaseMap.has(key))
						phaseMap.set(key, []);

					phaseMap.get(key)!.push(unit);
				}

				for (const [phaseKeyCombo, groupedUnits] of phaseMap.entries()) {
					steps.push({
						phases: phaseKeyCombo.split('|'),
						units: groupedUnits.map(u => u.config.key),
					});
				}
			}
		}

		this.logVerbose('Calculated execution steps: ', steps);
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
			const phase = this.keyToPhaseMap[phaseKey];
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
