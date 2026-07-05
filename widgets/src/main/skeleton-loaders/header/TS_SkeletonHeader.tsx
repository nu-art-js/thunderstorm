import {_className} from '@nu-art/thunder-core';
import {LL_V_L} from '../../layouts/v1/Layouts.js';
import {resolveSkeletonWidth, type SkeletonWidth} from '../consts.js';
import './TS_SkeletonHeader.scss';

type Props = {
	titleWidth?: SkeletonWidth;
	subtitleWidth?: SkeletonWidth;
	withSubtitle?: boolean;
	className?: string;
};

/** Placeholder title + optional subtitle stack. */
export const TS_SkeletonHeader = (props: Props) => {
	const titleWidth = resolveSkeletonWidth(props.titleWidth ?? 120, [100, 200]);
	const subtitleWidth = props.withSubtitle
		? resolveSkeletonWidth(props.subtitleWidth ?? 150, [150, 250])
		: undefined;
	return <LL_V_L className={_className('ts-skeleton-header', props.className)}>
		<div className={'ts-skeleton-header__title'} style={{width: titleWidth}}/>
		{props.withSubtitle && <div className={'ts-skeleton-header__subtitle'} style={{width: subtitleWidth}}/>}
	</LL_V_L>;
};
