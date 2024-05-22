import {asArray, exists} from '@nu-art/ts-common';
import {Phase} from './types';
import {UnitPhaseImplementor} from '../unit/core/types';
import {BaseUnit} from '../unit/core/BaseUnit';

type Unit<P extends Phase<string>[]> = BaseUnit & UnitPhaseImplementor<P>;

export class PhaseRunner<P extends Phase<string>[]>
	extends BaseUnit {

	private readonly phases: P;
	private units: Unit<P>[] = [];

	constructor(phases: P) {
		super({label: 'Phase Runner', key: 'phase-runner'});
		this.phases = phases;
	}

	//######################### Unit Logic #########################

	public registerUnits(units: Unit<P> | Unit<P>[]) {
		asArray(units).forEach(unit => this.units.push(unit));
	}

	private getUnitsForPhase(phase: P[number]) {
		return this.units.filter(unit => exists(unit[phase.method as keyof UnitPhaseImplementor<P>]));
	}

	private async initUnits() {
		return Promise.all(this.units.map(unit=> {
			// @ts-ignore
			unit.init()
		}));
	}

	//######################### Phase Logic #########################

	private async executePhase(phase: P[number]) {
		const willExecutePhase = exists(phase.filter) && !phase.filter();
		if (!willExecutePhase)
			return this.logInfo(`Will not execute phase: ${phase.name}, did not pass filter`);

		const units = this.getUnitsForPhase(phase);
		if (!units.length)
			return this.logInfo(`Will not execute phase: ${phase.name}, no units to execute`);

		this.logInfo(`Executing phase: ${phase.name} for ${units.length} units`);
		for (const unit of units) {
			await unit[phase.method as keyof UnitPhaseImplementor<P>]();
		}
	}

	//######################### Public Functions #########################

	public async execute() {
		await this.initUnits();
		await this.executeImpl();
	}

	private async executeImpl() {
		for (const phase of this.phases) {
			await this.executePhase(phase);
		}
	}
}