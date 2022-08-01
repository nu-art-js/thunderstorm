import './TS_ToastOverlay.scss';
import * as React from 'react';
import {_className} from '../../utils/tools';

export type TS_ToastType = 'info' | 'success' | 'warning' | 'error' | string // matches the classname of the background
export const TS_Toast = (props: { text: string, toastType: TS_ToastType }) => {

	return <div className={_className('ts-toast', props.toastType)}>
		<span className="ts-toast__content">{props.text}</span>
	</div>;

};