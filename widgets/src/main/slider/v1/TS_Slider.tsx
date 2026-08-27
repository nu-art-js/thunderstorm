import * as React from 'react';
import {ComponentSync} from '../../_core/ComponentSync.js';
import {_className} from '@nu-art/thunder-core';
import {LL_H_C} from '../../layouts/v1/Layouts.js';

type Props = {
	min: number;
	max: number;
	value?: number;
	startValue?: number;
	onValueChanged?: (value: number) => void | Promise<void>;
	onValueSet?: (value: number) => void | Promise<void>;
	disabled?: boolean;
	className?: string;
};
type State = {
	value: number | undefined;
};

export class TS_Slider
	extends ComponentSync<Props, State> {
	protected deriveStateFromProps(nextProps: Props): State {
		return {
			value: nextProps.value === undefined ? this.getValue() : nextProps.value
		};
	}

	private getValue() {
		return this.state?.value ?? this.props.startValue ?? (this.props.min + this.props.max) / 2;
	}

	private onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value: number | undefined = e.target.valueAsNumber;
		if (isNaN(value))
			value = undefined;
		this.setState({value}, () => {
			this.props.onValueChanged?.(value ?? this.props.min);
		});
	};
	private onMouseUp = (e: React.MouseEvent) => {
		this.props.onValueSet?.(this.state.value ?? this.props.min);
	};
	private calculateBGSize = () => {
		return (((this.state.value ?? this.props.min) - this.props.min) * 100) / (this.props.max - this.props.min);
	};

	private renderCurrentValue() {
		return <input className={'ts-slider__current-value'} type={'number'} value={this.state.value} onChange={this.onValueChange}/>;
	}

	private renderSliderInput() {
		return <input type={'range'} value={this.state.value ?? this.props.min} min={this.props.min} max={this.props.max} onChange={this.onValueChange}
									onMouseUp={this.onMouseUp} style={{backgroundSize: `${this.calculateBGSize()}% 100%`}}/>;
	}

	render() {
		const className = _className('ts-slider', this.props.className);
		return <LL_H_C className={className}>
			{this.renderSliderInput()}
			{this.renderCurrentValue()}
		</LL_H_C>;
	}
}
