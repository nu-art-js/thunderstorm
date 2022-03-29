import {HTMLProps} from 'react';
import * as React from 'react';
import './_Layouts.scss';

const LinearLayout = ((className: string, props: HTMLProps<HTMLDivElement>) => {
	return <div {...props} className={`${className} ${props.className || ''}`}>
		{props.children}
	</div>;
});

export const LL_V_L = (props: HTMLProps<HTMLDivElement>) => LinearLayout('ll_v_l', props);
export const LL_V_C = (props: HTMLProps<HTMLDivElement>) => LinearLayout('ll_v_c', props);
export const LL_V_R = (props: HTMLProps<HTMLDivElement>) => LinearLayout('ll_v_r', props);
export const LL_H_T = (props: HTMLProps<HTMLDivElement>) => LinearLayout('ll_h_t', props);
export const LL_H_C = (props: HTMLProps<HTMLDivElement>) => LinearLayout('ll_h_c', props);
export const LL_H_B = (props: HTMLProps<HTMLDivElement>) => LinearLayout('ll_h_b', props);
