import { TS_Loader } from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import './PgDev_Loader.scss';

const Render_PgDev_Loader = () => {
	return <div className={'pgdev-loader'}>
		<TS_Loader/>
	</div>;
};

export const PgDev_Loader = {name: 'PgDev-Loader', renderer: Render_PgDev_Loader};