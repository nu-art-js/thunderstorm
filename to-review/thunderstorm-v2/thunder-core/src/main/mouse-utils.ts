/*
 * @nu-art/thunder-core - Thunderstorm core types: dispatcher and mouse utilities
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent} from 'react';

/**
 * Prevents default behaviour and stops propagation.
 */
export const stopPropagation = (e: MouseEvent | ReactMouseEvent | KeyboardEvent | ReactKeyboardEvent) => {
	e.preventDefault();
	e.stopPropagation();
};

export type MouseClickActions = {
	left?: () => void;
	middle?: () => void;
	right?: () => void;
};

/**
 * Invokes the action for the button that triggered the event (left/middle/right).
 */
export const mouseEventHandler = (e: ReactMouseEvent | MouseEvent, actions: MouseClickActions) => {
	const key: keyof MouseClickActions = e.button === 0 ? 'left' : (e.button === 1 ? 'middle' : 'right');
	return actions[key]?.();
};
