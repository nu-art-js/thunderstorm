import {BlessedElements} from './consts';

type Created = typeof BlessedElements;

/**
 * A type representing the keys of BlessedElements.
 */
export type BlessedWidgetsType = keyof Created;

/**
 * A type representing the options for each Blessed widget.
 */
export type BlessedWidgetOptions = {
	[Type in keyof Created]: Parameters<Created[Type]>[0];
};

/**
 * A type representing each Blessed widget.
 */
export type BlessedWidget = {
	[Type in keyof Created]: ReturnType<Created[Type]>;
};