import {useLocation} from 'react-router-dom';
import type {TS_Route} from './types.js';

/** Remount key for routes that declare `paramKeys` — changes when those query params change. */
export const buildRouteQueryKey = (route: TS_Route, search: string): string => {
	if (!route.paramKeys?.length)
		return route.key;

	const query = search.startsWith('?') ? search.substring(1) : search;
	const params = new URLSearchParams(query);
	const parts = route.paramKeys.map(key => `${String(key)}=${params.get(String(key)) ?? ''}`);
	return `${route.key}:${parts.join(':')}`;
};

/** Route page shell — subscribes to location (incl. search) and remounts the page when `paramKeys` change. */
export const TS_RoutePage = (props: { route: TS_Route }) => {
	const {search} = useLocation();
	const Component = props.route.Component;
	if (!Component)
		return null;

	return <Component key={buildRouteQueryKey(props.route, search)}/>;
};
