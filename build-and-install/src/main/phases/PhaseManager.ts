import {addItemToArray, BadImplementationException, exists, flatArray, Logger, removeItemFromArray, timeCounter, TypedMap} from '@nu-art/ts-common';
import {RunningStatusHandler} from '../runtime/RunningStatusHandler.js';
import {Phase} from './definitions/index.js';
import {BaseUnit} from '../units/index.js';
import {PhaseAggregatedException} from '../exceptions/PhaseAggregatedException.js';
import {UnitPhaseException} from '../exceptions/UnitPhaseException.js';

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
	private readonly phases: Phase<any>[][];
	private readonly units: BaseUnit[][];
	private runningUnits: BaseUnit[] = [];
	private killed = false;
	private runningStatus: RunningStatusHandler;
	private activeUnits: string[];
	private projectUnitKeys: string[];
	private readonly keyToPhaseMap: TypedMap<Phase<any>>;

	constructor(runningStatus: RunningStatusHandler, phases: Phase<any>[][], units: BaseUnit[][], activeUnits: string[], projectUnitKeys: string[]) {
		super();
		this.phases = phases;
		this.units = units;
		this.runningStatus = runningStatus;
		this.activeUnits = activeUnits;
		this.projectUnitKeys = projectUnitKeys;

		const unitsSet = new Set();
		for (const unit of flatArray(this.units)) {
			if (unitsSet.has(unit.config.key))
				throw new BadImplementationException(`Found duplicate unit: '${unit.config.key}' in the project`);
			unitsSet.add(unit.config.key);
		}

		const phasesSet = new Set();
		const flatPhases = flatArray(this.phases);
		for (const phase of flatPhases) {
			if (phasesSet.has(phase.key))
				throw new BadImplementationException(`Found duplicate phase '${phase.key}' in the project`);
			phasesSet.add(phase.key);
		}

		this.keyToPhaseMap = flatPhases.reduce<TypedMap<Phase<any>>>((acc, phase) => {
			acc[phase.key] = phase;
			return acc;
		}, {});
	}

	//######################### Initialization #########################

	async calculateExecutionSteps(): Promise<ScheduledStep[]> {
		const steps: ScheduledStep[] = [];
		this.logDebug('Calculating execution steps for phases: ', this.phases.map(phases => phases.map(phase => phase.key)));
		this.logDebug('Active Units: ', this.activeUnits);
		this.logDebug('Project Units: ', this.projectUnitKeys);

		for (let phaseGroup of this.phases) {
			phaseGroup = phaseGroup.filter(phase => !exists(phase.filter) || phase.filter(this.runningStatus.runtimeParams));

			for (const layer of this.units) {
				const layerUnits = layer.filter(u => this.activeUnits.includes(u.config.key));
				if (layerUnits.length === 0)
					continue;

				const phaseMap: Map<string, BaseUnit[]> = new Map();

				for (const unit of layerUnits) {
					const supportedPhases = phaseGroup.filter(phase => phase.method in unit && typeof unit[phase.method as keyof typeof unit] === 'function');
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
		this.runningUnits = [];
		for (let i = this.runningStatus.startIndex; i < _steps.length; i++) {
			if (this.killed)
				break;


			const scheduledStep = _steps[i];
			const step = this.mapStep(scheduledStep);
			await this.runningStatus.onStepStarted(i);
			this.logDebug(`Executing step #${i + 1}/${_steps.length}`);
			this.logVerbose(scheduledStep);

			const errors: UnitPhaseException[] = [];
			let failedStep;
			await Promise.all(
				step.units.map(async (unit) => {
					if (this.runningStatus.isCompleted(unit.config.key))
						return;

					let failed = false;
					for (const phase of step.phases) {
						if (this.killed)
							break;

						if (this.runningStatus.runtimeParams.dryRun) {
							this.logInfo(`[${phase.key}] - ${unit.config.key}`);
							continue;
						}

						addItemToArray(this.runningUnits, unit);

						const dtCounter = timeCounter();
						try {
							this.logInfo(`Phase(${phase.name}) - Running - ${unit.config.key}`);
							if (typeof unit[phase.method as keyof BaseUnit] === 'function')
								await (unit[phase.method as keyof BaseUnit] as Function).call(unit);

							let operationDuration = '';
							if (dtCounter.dt() > 1500)
								operationDuration = ` (${dtCounter.format('mm:ss')})`;

							this.logInfo(`Phase(${phase.name}) - Completed${operationDuration} - ${unit.config.key}`);
						} catch (error: any) {
							this.logError(`Phase(${phase.name}) - Error - ${unit.config.key}`, error);
							errors.push(new UnitPhaseException(error, unit, phase.key));
							failedStep = scheduledStep;
							this.killed = true;
							failed = true;
							break;
						} finally {
							removeItemFromArray(this.runningUnits, unit);
						}
					}
					if (!failed)
						await this.runningStatus.onUnitCompleted(unit.config.key);
				})
			);

			if (failedStep && errors.length) {
				throw new PhaseAggregatedException(errors, failedStep);
			}

			await this.runningStatus.onStepEnded();
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
