import type { MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
/**
 * Prevents default behaviour and stops propagation.
 */
export declare const stopPropagation: (e: MouseEvent | ReactMouseEvent | KeyboardEvent | ReactKeyboardEvent) => void;
export type MouseClickActions = {
    left?: () => void;
    middle?: () => void;
    right?: () => void;
};
/**
 * Invokes the action for the button that triggered the event (left/middle/right).
 */
export declare const mouseEventHandler: (e: ReactMouseEvent | MouseEvent, actions: MouseClickActions) => void | undefined;
