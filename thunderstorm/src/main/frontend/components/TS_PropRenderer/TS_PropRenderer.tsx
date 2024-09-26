import './TS_PropRenderer.scss';
import * as React from 'react';
import {LinearLayoutProps, LL_H_B, LL_H_C, LL_H_T, LL_V_L} from '../Layouts';
import {_className} from '../../utils/tools';
import {resolveContent} from '@nu-art/ts-common';

export type PropRenderer_BaseProps = React.PropsWithChildren<{
	label: React.ReactNode | (() => React.ReactNode),
	disabled?: boolean,
	error?: string;
	className?: string;
}>

export type Props_PropRenderer = Omit<LinearLayoutProps, 'label'> & PropRenderer_BaseProps;

export type Props_PropRendererHorizontal = Props_PropRenderer & Partial<{
	verticalAlignment: 'top' | 'center' | 'bottom'
}>

const TS_PropRenderer_Horizontal = (props: Props_PropRendererHorizontal) => {
	const className = _className('ts-prop-renderer horizontal', props.disabled && 'disabled', props.className);
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
		<div className={'ts-prop-renderer__label'}>
			{resolveContent(label)}
			{props.error && <div className={'ts-prop-renderer__error'}>{props.error}</div>}
		</div>
		{props.children}
	</_LinearComponent>;
};

const TS_PropRenderer_Vertical = (props: Props_PropRenderer) => {
	const className = _className('ts-prop-renderer vertical', props.disabled && 'disabled', props.className);
	const {label, error, ..._props} = props;
	return <LL_V_L {..._props} className={className}>
		<div className={'ts-prop-renderer__label'}>
			{resolveContent(label)}
			{props.error && <div className={'ts-prop-renderer__error'}>{props.error}</div>}
		</div>
		{props.children}
	</LL_V_L>;
};

const TS_PropRenderer_Flat = (props: PropRenderer_BaseProps) => {
	const labelClass = _className('ts-prop-renderer__label', props.disabled && 'disabled', props.className);
	return <>
		<div className={labelClass}>
			{resolveContent(props.label)}
			{props.error && <div className={'ts-prop-renderer__error'}>{props.error}</div>}
		</div>
		{props.children}
	</>;
};

export const TS_PropRenderer = {
	Vertical: TS_PropRenderer_Vertical,
	Horizontal: TS_PropRenderer_Horizontal,
	Flat: TS_PropRenderer_Flat,
};
