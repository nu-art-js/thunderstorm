import {TS_Icons} from '@nu-art/ts-styles';

/** Token row actions — single map from semantic action to TS_Icons SVG component. */
export const TokenActionIcons = {
	locate: TS_Icons.pulse,
	reset: TS_Icons.undo,
	link: TS_Icons.link
} as const;

export type TokenActionIconKey = keyof typeof TokenActionIcons;
