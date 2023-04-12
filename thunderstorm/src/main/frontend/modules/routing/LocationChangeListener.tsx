import * as React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useEffect} from 'react';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {ModuleFE_RoutingV2} from './ModuleFE_RoutingV2';


export interface OnLocationChanged {
	__onLocationChanged: (path: string) => void;
}

export const dispatch_onLocationChanged = new ThunderDispatcher<OnLocationChanged, '__onLocationChanged'>('__onLocationChanged');

export const LocationChangeListener = () => {
	const location = useLocation();
	const navigate = useNavigate();
	useEffect(() => {
		console.log(location);
		dispatch_onLocationChanged.dispatchUI(location.pathname);
	}, [location]);
	ModuleFE_RoutingV2.setNavigate(navigate);
	return <></>;
};