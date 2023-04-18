import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_ProgressBar.scss';

type Props = {
	ratio: number;
};

type State = {
	percentage: number;
};

export class TS_ProgressBar
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state ??= this.state ? {...this.state} : {} as State;
		state.percentage = Math.floor(nextProps.ratio * 100);
		return state;
	}

	render() {
		return <div className={'ts-progress-bar'}>
			<div className={'ts-progress-bar__inner'} style={{width: `${this.state.percentage}%`}}/>
		</div>;
	}
}