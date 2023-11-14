import './TS_ToastOverlay.scss';
import * as React from 'react';
import {_className} from '../../utils/tools';

import './TS_Toast.scss';


export type TS_ToastType = 'info' | 'success' | 'warning' | 'error' | string // matches the classname of the background
export const TS_Toast = (content: string | React.ReactNode, toastType: TS_ToastType) => {
	if (typeof content === 'string')
		content = <span className="ts-toast__content">{content}</span>;

	return <div className={_className('ts-toast', toastType)}>{content}</div>;
};
