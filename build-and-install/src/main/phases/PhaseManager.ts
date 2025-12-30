import {addItemToArray, BadImplementationException, exists, flatArray, Logger, removeItemFromArray, timeCounter, TypedMap} from '@nu-art/ts-common';
import {RunningStatusHandler} from '../runtime/RunningStatusHandler.js';
import {Phase} from './definitions/index.js';
import {BaseUnit} from '../units/index.js';
import {PhaseAggregatedException} from '../exceptions/PhaseAggregatedException.js';
import {UnitPhaseException} from '../exceptions/UnitPhaseException.js';

/**
 * Scheduled execution step (before mapping to actual phases/units).
 */
export type ScheduledStep = {
	phases: string[];
	units: string[];
};

/**
 * Mapped execution step with actual phase and unit instances.
 */
export type ExecutionStep = {
	phases: Phase<any>[];
	units: BaseUnit<any>[];
};

/**
 * Manages phase execution across units in dependency order.
 * 
 * **Execution Model**:
 * - **Phase Groups**: Phases that can run in parallel (e.g., [prepare, compile])
 * - **Unit Layers**: Units grouped by dependency level (dependencies first)
 * - **Steps**: Combinations of phase groups × unit layers
 * 
 * **Execution Flow**:
 * 1. `calculateExecutionSteps()`: Plans which phases run on which units
 * 2. `execute()`: Executes steps sequentially, phases in parallel within steps
 * 3. Units in same layer run phases in parallel (Promise.all)
 * 
 * **Eligibility Rules**:
 * - Unit must implement the phase method (e.g., `compile()`, `test()`)
 * - Unit must be in active/project units (based on phase.unitCategory)
 * - Phase filter (if present) must pass runtime params
 * 
 * **Error Handling**:
 * - First failure stops execution (sets `killed = true`)
 * - Aggregates all errors into `PhaseAggregatedException`
 * - Tracks running units for graceful shutdown
 * 
 * **Resume Support**:
 * - Skips completed steps (via `runningStatus.startIndex`)
 * - Skips completed units within steps (via `runningStatus.isCompleted()`)
 * 
 * **Validation**:
 * - Constructor validates no duplicate units or phases
 * - Throws `BadImplementationException` on duplicates
 */
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

	/**
	 * Calculates the execution plan: which phases run on which units.
	 * 
	 * **Algorithm**:
	 * 1. For each phase group (phases that can run together)
	 * 2. Filter phases by runtime params (if phase.filter exists)
	 * 3. For each unit layer (dependency level)
	 * 4. Find units eligible for at least one phase in the group
	 * 5. Group units by which phases they support
	 * 6. Create steps: phase combinations × unit groups
	 * 
	 * **Phase Grouping**: Units that support the same set of phases are grouped
	 * together in a step (identified by phase keys joined with '|').
	 * 
	 * **Unit Eligibility**:
	 * - Unit must implement phase method
	 * - Unit must be in active/project units (based on phase.unitCategory)
	 * 
	 * @returns Array of scheduled steps (phases and unit keys)
	 */
	async calculateExecutionSteps(): Promise<ScheduledStep[]> {
		const steps: ScheduledStep[] = [];
		this.logDebug('Calculating execution steps for phases: ', this.phases.map(phases => phases.map(phase => phase.key)));
		this.logDebug('Active Units: ', this.activeUnits);
		this.logDebug('Project Units: ', this.projectUnitKeys);

		for (let phaseGroup of this.phases) {
			phaseGroup = phaseGroup.filter(phase => !exists(phase.filter) || phase.filter(this.runningStatus.runtimeParams));

			for (const layer of this.units) {
				// Determine eligible units for this phase group
				// A unit is eligible if it's eligible for at least one phase in the group
				const eligibleUnitKeys = new Set<string>();
				for (const phase of phaseGroup) {
					const unitCategory = phase.unitCategory ?? "active";
					const phaseEligibleKeys = unitCategory === "project" ? this.projectUnitKeys : this.activeUnits;
					phaseEligibleKeys.forEach(key => eligibleUnitKeys.add(key));
				}

				const layerUnits = layer.filter(u => eligibleUnitKeys.has(u.config.key));
				if (layerUnits.length === 0)
					continue;

				const phaseMap: Map<string, BaseUnit[]> = new Map();

				for (const unit of layerUnits) {
					// Find phases this unit supports and is eligible for
					const supportedPhases = phaseGroup.filter(phase => {
						if (!(phase.method in unit && typeof unit[phase.method as keyof typeof unit] === 'function'))
							return false;
						
						// Check if unit is eligible for this specific phase
						const unitCategory = phase.unitCategory ?? "active";
						const phaseEligibleKeys = unitCategory === "project" ? this.projectUnitKeys : this.activeUnits;
						return phaseEligibleKeys.includes(unit.config.key);
					});
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

	/**
	 * Executes the planned steps sequentially.
	 * 
	 * **Execution Model**:
	 * - Steps run sequentially (one after another)
	 * - Units within a step run phases in parallel (Promise.all)
	 * - Phases for a unit run sequentially (in phase group order)
	 * 
	 * **Resume Support**:
	 * - Starts from `runningStatus.startIndex` (if --continue)
	 * - Skips units marked as completed
	 * 
	 * **Dry Run**: If `--dry-run`, only logs phase/unit names without executing.
	 * 
	 * **Error Handling**:
	 * - First error stops execution (sets `killed = true`)
	 * - All errors aggregated into `PhaseAggregatedException`
	 * - Running units tracked for graceful shutdown
	 * 
	 * **Performance**: Logs operation duration if > 1.5 seconds.
	 * 
	 * @param _steps - Scheduled steps to execute
	 * @throws PhaseAggregatedException if any phase fails
	 */
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

	/**
	 * Gracefully stops execution and kills all running units.
	 * 
	 * Called on SIGINT (Ctrl+C). Sets `killed = true` to stop further execution,
	 * then calls `kill()` on all currently running units.
	 * 
	 * @returns Promise that resolves when all units are killed
	 */
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
