import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {LL_H_C} from '../Layouts';
import {_className} from '../../utils/tools';
import './TS_Toggler.scss';

type Props<T> = {
	options: [T, T];
	defaultValue?: T;
	value?: T;
	onValueChange?: (value: T | undefined) => void | Promise<void>;
	disabled?: boolean;
}

type State<T> = {
	value: T | undefined;
}

export class TS_Toggler<T extends number | string = number | string>
	extends ComponentSync<Props<T>, State<T>> {

	protected deriveStateFromProps(nextProps: Props<T>): State<T> {
		const state: State<T> = {} as State<T>;
		//First derive
		if (!this.state)
			state.value = this.props.defaultValue;
		else
			state.value = this.props.value || this.state.value;
		return state;
	}

	private onValueChange = (value: T | undefined) => {
		const _value = value === this.state.value ? undefined : value;
		this.props.onValueChange?.(_value);
		this.setState({value: _value});
		this.reDeriveState();
	};

	private cycleToggler = () => {
		const options = this.props.options;
		if (this.state.value === undefined)
			this.onValueChange(options[0]);

		if (this.state.value === options[0])
			this.onValueChange(options[1]);

		if (this.state.value === options[1])
			this.onValueChange(undefined);
	};

	private renderButton = () => {
		let buttonDir: string | undefined = undefined;

		if (this.state.value === this.props.options[0])
			buttonDir = 'left';
		if (this.state.value === this.props.options[1])
			buttonDir = 'right';

		const buttonClassName = _className('ts-toggler__toggler-button', buttonDir);

		return <div className={'ts-toggler__toggler'} onClick={() => !this.props.disabled && this.cycleToggler()}>
			<div className={buttonClassName}/>
		</div>;
	};

	private renderOption = (option: T) => {
		const className = _className('ts-toggler__option', option === this.state?.value ? 'active' : undefined);
		return <span className={className} onClick={() => !this.props.disabled && this.onValueChange(option)}>{option}</span>;
	};

	render() {
		const className = _className('ts-toggler', this.props.disabled ? 'disabled' : undefined);
		return <LL_H_C className={className}>
			{this.renderOption(this.props.options[0])}
			{this.renderButton()}
			{this.renderOption(this.props.options[1])}
		</LL_H_C>;
	}
}
