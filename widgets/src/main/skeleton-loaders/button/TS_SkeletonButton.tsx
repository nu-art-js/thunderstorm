import * as React from 'react';
import {_className} from '@nu-art/thunder-core';
import {resolveSkeletonWidth, type SkeletonWidth} from '../consts.js';
import './TS_SkeletonButton.scss';

type Props = React.PropsWithChildren<{
	width?: SkeletonWidth;
	height?: number;
	className?: string;
}>;

/** Placeholder block shaped like a button. */
export const TS_SkeletonButton = (props: Props) => {
	const width = props.width ?? 90;
	const height = props.height ?? 24;
	const resolvedWidth = resolveSkeletonWidth(width, [100, 200]);
	return <div
		className={_className('ts-skeleton-button', props.className)}
		style={{width: resolvedWidth, height}}
	>{props.children}</div>;
};
