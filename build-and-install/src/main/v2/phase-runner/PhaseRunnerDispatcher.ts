import {removeItemFromArray} from '@nu-art/ts-common';
import {Phase} from '../phase/types';
import {BaseUnit} from '../unit/core';

export const PhaseRunnerEventType_PhaseChange = 'phase-change';
export const PhaseRunnerEventType_UnitStatusChange = 'unit-status-change';
const PhaseRunnerEventTypes = [PhaseRunnerEventType_PhaseChange, PhaseRunnerEventType_UnitStatusChange] as const;
export type PhaseRunnerEventType = typeof PhaseRunnerEventTypes[number];

export type PhaseRunnerEvent_PhaseChange = {
	type: typeof PhaseRunnerEventType_PhaseChange;
	data: Phase<string>;
}

export type PhaseRunnerEvent_UnitStatusChange = {
	type: typeof PhaseRunnerEventType_UnitStatusChange;
	data: BaseUnit;
}

export type PhaseRunnerEvent = PhaseRunnerEvent_PhaseChange | PhaseRunnerEvent_UnitStatusChange;

export interface PhaseRunnerEventListener {
	__onPhaseRunnerEvent: (event: PhaseRunnerEvent) => void;
}

class PhaseRunnerDispatcher_Class {

	private listeners: PhaseRunnerEventListener[] = [];

	//######################### Listeners Logic #########################

	public addListener(listener: PhaseRunnerEventListener) {
		this.listeners.push(listener);
	}

	public removeListener(listener: PhaseRunnerEventListener) {
		removeItemFromArray(this.listeners, listener);
	}

	public fireEvent(event: PhaseRunnerEvent) {
		this.listeners.forEach(listener => listener.__onPhaseRunnerEvent(event));
	}
}

export const PhaseRunnerDispatcher = new PhaseRunnerDispatcher_Class();