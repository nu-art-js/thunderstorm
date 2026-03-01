/*
 * Save-event handler helper for editable Input and TextArea.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type SaveEventName = 'change' | 'blur' | 'accept';

export type SaveEventHandlers<Value = string> = {
	onChange?: (value: Value) => void;
	onBlur?: (value: Value) => void;
	onAccept?: (value: Value) => void;
};

export function mergeSaveEvents(
	templateProps: { saveEvent?: SaveEventName[] },
	props: { saveEvent?: SaveEventName[] }
): SaveEventName[] {
	return [...(props.saveEvent ?? []), ...(templateProps.saveEvent ?? [])];
}

export function createSaveEventHandlers<Value>(
	saveEvents: SaveEventName[],
	saveEventHandler: (value: Value) => void | Promise<void>
): SaveEventHandlers<Value> {
	const out: SaveEventHandlers<Value> = {};
	if (saveEvents.includes('change'))
		out.onChange = saveEventHandler as (value: Value) => void;
	if (saveEvents.includes('blur'))
		out.onBlur = saveEventHandler as (value: Value) => void;
	if (saveEvents.includes('accept'))
		out.onAccept = saveEventHandler as (value: Value) => void;
	return out;
}
