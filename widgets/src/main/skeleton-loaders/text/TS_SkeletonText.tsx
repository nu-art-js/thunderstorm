import * as React from 'react';
import {_className} from '@nu-art/thunder-core';
import {resolveSkeletonWidth, type SkeletonWidth} from '../consts.js';
import './TS_SkeletonText.scss';

export type SkeletonTextVariant = 'normal' | 'light' | 'bold';

type Props = {
	width?: SkeletonWidth;
	height?: number;
	variant?: SkeletonTextVariant;
	/** When set, renders real copy instead of a placeholder block (hybrid loading). */
	text?: string;
	className?: string;
};

/** Placeholder block shaped like a line of text. */
export const TS_SkeletonText = (props: Props) => {
	const className = _className('ts-skeleton-text', props.variant ?? 'normal', props.className);
	if (props.text)
		return <div className={className}>{props.text}</div>;

	const style: React.CSSProperties = {};
	if (props.width !== undefined)
		style.width = resolveSkeletonWidth(props.width, [100, 200]);
	if (props.height !== undefined)
		style.height = props.height;

	return <div
		className={className}
		style={Object.keys(style).length ? style : undefined}
	/>;
};
