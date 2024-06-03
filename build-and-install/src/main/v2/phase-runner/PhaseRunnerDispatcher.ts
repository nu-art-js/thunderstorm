import {FunctionKeys, ParamResolver, removeItemFromArray} from '@nu-art/ts-common';
import {Phase} from '../phase/types';
import {BaseUnit} from '../unit/core';

class PhaseRunnerDispatcher<T,
	K extends FunctionKeys<T> = FunctionKeys<T>,
	P extends ParamResolver<T, K> = ParamResolver<T, K>,
> {

	private readonly method: K;

	constructor(method: K) {
		this.method = method;
	}

	private listeners: T[] = [];

	//######################### Listeners Logic #########################

	public addListener(listener: any) {
		this.listeners.push(listener);
	}

	public removeListener(listener: any) {
		removeItemFromArray(this.listeners, listener);
	}

	public dispatch(...data: P) {
		this.listeners.forEach(listener => {
			// @ts-ignore
			listener[this.method]?.(...data);
		});
	}
}

export interface PhaseRunner_OnPhaseChange {
	__onPhaseChange: (data: Phase<string>) => void;
}

export const dispatcher_PhaseChange = new PhaseRunnerDispatcher<PhaseRunner_OnPhaseChange>('__onPhaseChange');

export interface PhaseRunner_OnUnitStatusChange {
	__onUnitStatusChange: (data: BaseUnit) => void;
}

export const dispatcher_UnitStatusChange = new PhaseRunnerDispatcher<PhaseRunner_OnUnitStatusChange>('__onUnitStatusChange');

export interface PhaseRunner_OnUnitsChange {
	__onUnitsChange: (data: BaseUnit[]) => void;
}

export const dispatcher_UnitChange = new PhaseRunnerDispatcher<PhaseRunner_OnUnitsChange>('__onUnitsChange');