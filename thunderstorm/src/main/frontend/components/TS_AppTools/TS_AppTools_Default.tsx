import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_Route} from '../../modules/routing/types';

export class TS_AppTools_Default extends ComponentSync {

	static Route: TS_Route = {
		key: 'app-tools-default',
		path: '',
		index: true,
		Component: this,
	};

	protected deriveStateFromProps(nextProps: any, state?: Partial<any> | undefined) {
	}

	render() {
		return <div>Default App-Tools Renderer</div>;
	}
}