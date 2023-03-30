import * as React from 'react';
import {useLocation} from 'react-router-dom';
import {useEffect} from 'react';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';

export interface OnLocationChanged {
	__onLocationChanged: (path: string) => void;
}

export const dispatch_onLocationChanged = new ThunderDispatcher<OnLocationChanged, '__onLocationChanged'>('__onLocationChanged');

export const LocationChangeListener = () => {
	const location = useLocation();
	useEffect(() => {
		console.log(location);
		dispatch_onLocationChanged.dispatchUI(location.pathname);
	}, [location]);
	return <></>;
};