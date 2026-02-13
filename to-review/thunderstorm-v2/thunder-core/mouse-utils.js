/*
 * @nu-art/thunder-core - Thunderstorm core types: dispatcher and mouse utilities
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
/**
 * Prevents default behaviour and stops propagation.
 */
export const stopPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
};
/**
 * Invokes the action for the button that triggered the event (left/middle/right).
 */
export const mouseEventHandler = (e, actions) => {
    const key = e.button === 0 ? 'left' : (e.button === 1 ? 'middle' : 'right');
    return actions[key]?.();
};
