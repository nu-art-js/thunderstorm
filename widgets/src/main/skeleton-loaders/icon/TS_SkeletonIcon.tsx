import {_className} from '@nu-art/thunder-core';
import './TS_SkeletonIcon.scss';

type Variant = 'round' | 'square';

type Props = {
	variant?: Variant;
	width?: number;
	className?: string;
};

/** Placeholder block shaped like an icon. */
export const TS_SkeletonIcon = (props: Props) => {
	const className = _className('ts-skeleton-icon', props.variant ?? 'round', props.className);
	return <div
		className={className}
		style={{width: props.width ?? 16}}
	/>;
};
