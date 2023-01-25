import './TS_PropRenderer.scss';
import * as React from 'react';
import {ReactNode} from 'react';
import {LL_H_C} from '../Layouts';
import {_className} from '../../utils/tools';

type Props = {
	label: string,
	children?: ReactNode
	onClick?: (e: React.MouseEvent) => void;
	className?: string;
}

export const TS_PropRenderer = (props: Props) => {
	const className = _className('ts-prop-renderer', props.className);
	return <LL_H_C className={className} onClick={e => props.onClick?.(e)}>
		<div className="ts-prop-renderer__label">{props.label}</div>
		{props.children}
	</LL_H_C>;
};
