import {FunctionKeys, ParamResolver, removeItemFromArray} from '@nu-art/ts-common';
import {Phase} from '../phase/types';
import {BaseUnit} from '../unit/core';

export interface PhaseRunnerEventListener {
	__onPhaseChange: (data: Phase<string>) => void;
	__onUnitStatusChange: (data: BaseUnit) => void;
}

class PhaseRunnerDispatcher<
	K extends FunctionKeys<PhaseRunnerEventListener>,
	P extends ParamResolver<PhaseRunnerEventListener, K> = ParamResolver<PhaseRunnerEventListener, K>,
> {

	private readonly method: K;

	constructor(method: K) {
		this.method = method;
	}

	private listeners: PhaseRunnerEventListener[] = [];

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
			listener[this.method]?.(...data)
		});
	}
}

export const dispatcher_PhaseChange = new PhaseRunnerDispatcher('__onPhaseChange');
export const dispatcher_UnitStatusChange = new PhaseRunnerDispatcher('__onUnitStatusChange');