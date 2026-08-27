import {generateArray} from '@nu-art/ts-common';
import {_className} from '@nu-art/thunder-core';
import {LL_V_L} from '../../layouts/v1/Layouts.js';
import {TS_SkeletonText, type SkeletonTextVariant} from '../text/TS_SkeletonText.js';
import './TS_SkeletonParagraph.scss';

type Props = {
	rowCount: number;
	variant?: SkeletonTextVariant;
	className?: string;
};

/** Stack of text-line placeholders — last row is shorter. */
export const TS_SkeletonParagraph = (props: Props) => {
	return <LL_V_L className={_className('ts-skeleton-paragraph', props.className)}>
		{generateArray(props.rowCount, index => {
			if (index === props.rowCount - 1)
				return <TS_SkeletonText key={index} variant={props.variant} width={'65%'}/>;

			return <TS_SkeletonText key={index} variant={props.variant} width={'100%'}/>;
		})}
	</LL_V_L>;
};
