import './TS_PropRenderer.scss';
import * as React from 'react';
import {LinearLayoutProps, LL_H_C, LL_V_L} from '../Layouts';
import {_className} from '../../utils/tools';

type Props = LinearLayoutProps & {
	label: string,
}

export const TS_PropRenderer_Horizontal = (props: Props) => {
	const className = _className('ts-prop-renderer', props.className);
	const {label, ..._props} = props;
	return <LL_H_C {..._props} className={className}>
		<div className="ts-prop-renderer__label">{label}</div>
		{props.children}
	</LL_H_C>;
};

export const TS_PropRenderer_Vertical = (props: Props) => {
	const className = _className('ts-prop-renderer', props.className);
	const {label, ..._props} = props;
	return <LL_V_L {..._props} className={className}>
		<div className="ts-prop-renderer__label">{props.label}</div>
		{props.children}
	</LL_V_L>;
};

export const TS_PropRenderer = {
	Vertical: TS_PropRenderer_Vertical,
	Horizontal: TS_PropRenderer_Horizontal,
};