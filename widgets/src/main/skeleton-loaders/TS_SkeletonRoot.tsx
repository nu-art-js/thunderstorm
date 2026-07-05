import * as React from 'react';
import {_className} from '@nu-art/thunder-core';
import type {SkeletonAnimation} from './types.js';
import './TS_SkeletonRoot.scss';

type Props = React.PropsWithChildren<{
	animation?: SkeletonAnimation;
	className?: string;
	/** When set, exposed to assistive tech instead of hiding the loading tree. */
	ariaLabel?: string;
}>;

/** Layout-root wrapper for skeleton trees — selects pulse vs shimmer animation on the subtree. */
export const TS_SkeletonRoot = (props: Props) => {
	const animation = props.animation ?? 'pulse';
	return <div
		className={_className('ts-skeleton', `ts-skeleton--${animation}`, props.className)}
		aria-busy={true}
		aria-label={props.ariaLabel}
		aria-hidden={props.ariaLabel ? undefined : true}
	>
		{props.children}
	</div>;
};
