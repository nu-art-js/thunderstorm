import {ComponentSync} from '@nu-art/thunderstorm-frontend';
import {TS_Route} from '@nu-art/thunder-routing/types.js';
import {LL_V_L} from '../Layouts/index.js';

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
		return <LL_V_L id={'app-tools-default'}>
			<div className={'title'}>Welcome To App Tools!</div>
			<div className={'sub-title'}>Pick a screen on the left to show</div>
		</LL_V_L>;
	}
}