import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';

export type Props_TSForm<T> = {
	value: T;
};

export type State_TSForm<T> = {};


export class TS_Form<T extends object>
	extends ComponentSync<Props_TSForm<T>, State_TSForm<T>> {

	protected deriveStateFromProps(nextProps: Props_TSForm<T>) {
		const state = this.state ? {...this.state} : {} as State_TSForm<T>;
		return state;
	}

	render() {
		return <div></div>;
	}
}