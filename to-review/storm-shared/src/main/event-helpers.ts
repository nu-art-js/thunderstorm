/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';

export const stopPropagation = (e: MouseEvent | React.MouseEvent | KeyboardEvent | React.KeyboardEvent) => {
	e.preventDefault();
	e.stopPropagation();
};

type MouseClickActions = {
	left?: () => void;
	middle?: () => void;
	right?: () => void;
};

export const mouseEventHandler = (e: React.MouseEvent | MouseEvent, actions: MouseClickActions) => {
	const key: keyof MouseClickActions = e.button === 0 ? 'left' : (e.button === 1 ? 'middle' : 'right');
	return actions[key]?.();
};
