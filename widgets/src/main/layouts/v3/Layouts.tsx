import * as React from 'react';
import {CSSProperties, HTMLProps} from 'react';
import '../_Layouts.scss';
import {_className} from '@nu-art/thunder-core';

export type LinearLayoutProps = React.PropsWithChildren<HTMLProps<HTMLDivElement>> & {
	ref?: React.Ref<any>;
	innerRef?: React.Ref<HTMLDivElement>;
	style?: CSSProperties;
};

function LinearLayout(props: LinearLayoutProps & { layoutClass: string }): React.ReactElement {
	const {innerRef, layoutClass, className, children, ...rest} = props;
	return (
		<div {...rest} ref={innerRef} className={_className(layoutClass, className)}>
			{children}
		</div>
	);
}

export function Grid(props: LinearLayoutProps): React.ReactElement {
	const {innerRef, className, children, ...rest} = props;
	return (
		<div {...rest} ref={innerRef} className={_className('ts-grid', className)}>
			{children}
		</div>
	);
}

export function LL_V_L(props: LinearLayoutProps): React.ReactElement {
	return <LinearLayout {...props} layoutClass="ll_v_l"/>;
}

export function LL_V_C(props: LinearLayoutProps): React.ReactElement {
	return <LinearLayout {...props} layoutClass="ll_v_c"/>;
}

export function LL_V_R(props: LinearLayoutProps): React.ReactElement {
	return <LinearLayout {...props} layoutClass="ll_v_r"/>;
}

export function LL_V_S(props: LinearLayoutProps): React.ReactElement {
	return <LinearLayout {...props} layoutClass="ll_v_s"/>;
}

export function LL_H_T(props: LinearLayoutProps): React.ReactElement {
	return <LinearLayout {...props} layoutClass="ll_h_t"/>;
}

export function LL_H_C(props: LinearLayoutProps): React.ReactElement {
	return <LinearLayout {...props} layoutClass="ll_h_c"/>;
}

export function LL_H_B(props: LinearLayoutProps): React.ReactElement {
	return <LinearLayout {...props} layoutClass="ll_h_b"/>;
}

export function LL_H_S(props: LinearLayoutProps): React.ReactElement {
	return <LinearLayout {...props} layoutClass="ll_h_s"/>;
}

export function LL_VH_C(props: LinearLayoutProps): React.ReactElement {
	return <LinearLayout {...props} layoutClass="ll_vh_c"/>;
}
