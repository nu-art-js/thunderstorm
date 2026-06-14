import * as React from 'react';

type TextControl = HTMLInputElement | HTMLTextAreaElement;

export type CopyFriendlyDisabledAttrs = {
	readOnly: true;
	tabIndex: -1;
	'aria-disabled': true;
	onPaste: React.ClipboardEventHandler<TextControl>;
	onCut: React.ClipboardEventHandler<TextControl>;
};

const blockClipboardEdit: React.ClipboardEventHandler<TextControl> = (event) => event.preventDefault();

/** DOM attrs for disabled inputs/textareas that remain selectable/copyable. */
export function resolveCopyFriendlyDisabledAttrs(
	disabled: boolean | undefined
): CopyFriendlyDisabledAttrs | Record<string, never> {
	if (!disabled)
		return {};

	return {
		readOnly: true,
		tabIndex: -1,
		'aria-disabled': true,
		onPaste: blockClipboardEdit,
		onCut: blockClipboardEdit,
	};
}

export function blurOnFocusWhenDisabled(
	disabled: boolean | undefined,
	onFocus?: React.FocusEventHandler<TextControl>
): React.FocusEventHandler<TextControl> {
	return (event) => {
		if (!disabled)
			onFocus?.(event);
		// When copy-friendly disabled (readOnly + .disabled), do not blur — blur prevents
		// click-drag selection. readOnly, caret-color, and guardKeyDown block editing.
	};
}

export function guardKeyDownWhenDisabled(
	disabled: boolean | undefined,
	onKeyDown?: React.KeyboardEventHandler<TextControl>
): React.KeyboardEventHandler<TextControl> | undefined {
	if (!disabled && !onKeyDown)
		return onKeyDown;

	return (event) => {
		if (disabled) {
			const allow = event.ctrlKey || event.metaKey || event.altKey;
			if (!allow)
				event.preventDefault();
		}
		onKeyDown?.(event);
	};
}
