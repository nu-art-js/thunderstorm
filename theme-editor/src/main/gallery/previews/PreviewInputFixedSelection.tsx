import * as React from 'react';
import {useCallback, useEffect, useRef} from 'react';
import {TS_Input} from '@nu-art/thunder-widgets/v3';

const FIXED_VALUE = 'Fixed selection — copy me';

const selectAll = (input: HTMLInputElement) => {
	input.setSelectionRange(0, input.value.length);
};

/**
 * Gallery-only fixture: read-only value with the full string always selected.
 * Exercises text selection inside `.dl-gallery { user-select: none }` — selection
 * must remain available and ::selection tokens must be visible.
 */
export const PreviewInputFixedSelection: React.FC = () => {
	const wrapRef = useRef<HTMLDivElement>(null);

	const inputEl = useCallback((): HTMLInputElement | undefined =>
		wrapRef.current?.querySelector('input.ts-input') ?? undefined, []);

	const lockSelection = useCallback(() => {
		const input = inputEl();
		if (!input)
			return;
		requestAnimationFrame(() => {
			if (input.selectionStart !== 0 || input.selectionEnd !== input.value.length)
				selectAll(input);
		});
	}, [inputEl]);

	useEffect(() => {
		const input = inputEl();
		if (input)
			selectAll(input);
	}, [inputEl]);

	return (
		<div ref={wrapRef}>
			<TS_Input
				type={'text'}
				readOnly
				value={FIXED_VALUE}
				onFocus={lockSelection}
				onSelect={lockSelection}
				onMouseUp={lockSelection}
				onKeyUp={lockSelection}
			/>
		</div>
	);
};
