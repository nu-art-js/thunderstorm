import './TS_PropRenderer.scss';
import * as React from 'react';
import {LinearLayoutProps, LL_H_B, LL_H_C, LL_H_T, LL_V_L} from '../Layouts';
import {_className} from '../../utils/tools';
import {resolveContent} from '@nu-art/ts-common';


type Props = Omit<LinearLayoutProps, 'label'> & {
	label: React.ReactNode | (() => React.ReactNode),
	error?: string;
}

type Props_Horizontal = Props & Partial<{
	verticalAlignment: 'top' | 'center' | 'bottom'
}>

const TS_PropRenderer_Horizontal = (props: Props_Horizontal) => {
	const className = _className('ts-prop-renderer horizontal', props.className);
	const {label, error, ..._props} = props;
	let _LinearComponent: React.ElementType;

	switch (props.verticalAlignment) {
		case 'top':
			_LinearComponent = LL_H_T;
			break;
		case 'bottom':
			_LinearComponent = LL_H_B;
			break;
		default:
			_LinearComponent = LL_H_C;
			break;
	}

	return <_LinearComponent {..._props} className={className}>
		<div className={'ts-prop-renderer__label'}>{resolveContent(label)}</div>
		{props.children}
		{/*<div className={'ts-prop-renderer__error'}>{props.error}</div>*/}
	</_LinearComponent>;
};

const TS_PropRenderer_Vertical = (props: Props) => {
	const className = _className('ts-prop-renderer vertical', props.className);
	const {label, error, ..._props} = props;
	return <LL_V_L {..._props} className={className}>
		<div className={'ts-prop-renderer__label'}>{resolveContent(label)}</div>
		{props.children}
		{/*<div className={'ts-prop-renderer__error'}>{props.error}</div>*/}
	</LL_V_L>;
};

export const TS_PropRenderer = {
	Vertical: TS_PropRenderer_Vertical,
	Horizontal: TS_PropRenderer_Horizontal,
};
