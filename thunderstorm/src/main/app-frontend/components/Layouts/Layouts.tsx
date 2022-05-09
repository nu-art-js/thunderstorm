import {HTMLProps} from 'react';
import * as React from 'react';
import './_Layouts.scss';
import {_className} from '../../utils/tools';

type LinearLayoutProps = HTMLProps<HTMLDivElement> & { innerRef?: React.RefObject<any>};

const LinearLayout = ((className: string, props: LinearLayoutProps) => {
	const _props = {...props}
	delete _props.innerRef;
	return <div
		{..._props}
		ref={props.innerRef}
		className={_className(className, _props.className)}>
		{_props.children}
	</div>;
});

export const LL_V_L = (props: LinearLayoutProps) => LinearLayout('ll_v_l', props);
export const LL_V_C = (props: LinearLayoutProps) => LinearLayout('ll_v_c', props);
export const LL_V_R = (props: LinearLayoutProps) => LinearLayout('ll_v_r', props);
export const LL_H_T = (props: LinearLayoutProps) => LinearLayout('ll_h_t', props);
export const LL_H_C = (props: LinearLayoutProps) => LinearLayout('ll_h_c', props);
export const LL_H_B = (props: LinearLayoutProps) => LinearLayout('ll_h_b', props);
export const LL_VH_C = (props: LinearLayoutProps) => LinearLayout('ll_v_c match_height flex__justify-center', props);