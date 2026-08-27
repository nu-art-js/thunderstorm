import * as React from 'react';
import {useCallback, useRef, useState} from 'react';
import {TS_Button} from '@nu-art/thunder-widgets/v3';
import {
	formatInspectSummary,
	inspectElementTokens
} from './theme-editor/element-token-inspect.js';

export type PreviewInspectButtonProps = {
	inspectMode: boolean;
	inspectHint?: string;
	onToggle: () => void;
};

export const PreviewInspectButton: React.FC<PreviewInspectButtonProps> = props => (
	<TS_Button
		variant={props.inspectMode ? 'primary' : 'secondary'}
		title={
			props.inspectMode
				? (props.inspectHint ?? 'Click a preview element to reveal its tokens.')
				: 'Inspect preview elements to reveal their tokens'
		}
		onClick={props.onToggle}
	>Inspect</TS_Button>
);

export type PreviewInspectWrapProps = {
	inspectMode: boolean;
	boundaryRef: React.RefObject<HTMLDivElement>;
	onInspectClick: (event: React.MouseEvent) => void;
	children: React.ReactNode;
	className?: string;
};

/** Click-capture boundary for inspect mode — one instance wraps the whole grid or a single preview. */
export const PreviewInspectWrap: React.FC<PreviewInspectWrapProps> = props => (
	<div
		ref={props.boundaryRef}
		className={[
			'dl-preview-inspect-wrap',
			props.className,
			props.inspectMode ? 'dl-preview-inspect' : undefined
		].filter(Boolean).join(' ')}
		onMouseDownCapture={props.inspectMode ? (e => e.preventDefault()) : undefined}
		onClickCapture={props.inspectMode ? props.onInspectClick : undefined}
	>
		{props.children}
	</div>
);

export type PreviewInspectController = {
	inspectMode: boolean;
	inspectHint?: string;
	toggleInspect: () => void;
	boundaryRef: React.RefObject<HTMLDivElement>;
	onInspectClick: (event: React.MouseEvent) => void;
};

/**
 * Shared inspect interaction for preview surfaces — Theme Editor (whole grid) and
 * Component Editor (single widget). Clicking an element highlights matching token rows
 * in the editor panel(s) above; does not animate/locate tokens.
 */
export function usePreviewInspect(
	onHighlightTokens: (tokens?: string[]) => void
): PreviewInspectController {
	const boundaryRef = useRef<HTMLDivElement>(null);
	const [inspectMode, setInspectMode] = useState(false);
	const [inspectHint, setInspectHint] = useState<string>();

	const toggleInspect = useCallback(() => {
		setInspectMode(active => {
			const next = !active;
			if (!next) {
				setInspectHint(undefined);
				onHighlightTokens(undefined);
			}
			return next;
		});
	}, [onHighlightTokens]);

	const onInspectClick = useCallback((event: React.MouseEvent) => {
		if (!inspectMode || !boundaryRef.current)
			return;

		event.preventDefault();
		event.stopPropagation();

		const target = event.target;
		if (!(target instanceof Element))
			return;

		const result = inspectElementTokens(target, boundaryRef.current);
		onHighlightTokens(result.tokens.length ? result.tokens : undefined);
		setInspectHint(formatInspectSummary(result));
	}, [inspectMode, onHighlightTokens]);

	return {
		inspectMode,
		inspectHint,
		toggleInspect,
		boundaryRef,
		onInspectClick
	};
}
