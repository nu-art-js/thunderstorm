import * as React from 'react';
import {_className, ComponentSync, LL_H_C} from '../..';
import './TS_Slider.scss';

type Props = {
	min: number;
	max: number;

	//Value control from outside
	value?: number;
	startValue?: number

	//Called whenever the value is changed
	onValueChanged?: (value: number) => void | Promise<void>;
	//Called whenever the value is set (i.e. the mouse click is let go)
	onValueSet?: (value: number) => void | Promise<void>;
	disabled?: boolean;
	className?: string;
}

type State = {
	value: number | undefined;
}

export class TS_Slider
	extends ComponentSync<Props, State> {

	// ######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props): State {
		return {
			value: nextProps.value === undefined ? this.getValue() : nextProps.value
		};
	}

	// ######################### Logic #########################

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

	// ######################### Render #########################

	private renderCurrentValue() {
		return <input
			className={'ts-slider__current-value'}
			type={'number'}
			value={this.state.value}
			onChange={this.onValueChange}
		/>;
	}

	private renderSliderInput() {
		return <input
			type={'range'}
			value={this.state.value ?? this.props.min}
			min={this.props.min}
			max={this.props.max}
			onChange={this.onValueChange}
			onMouseUp={this.onMouseUp}
			style={{backgroundSize: `${this.calculateBGSize()}% 100%`}}
		/>;
	}

	render() {
		const className = _className('ts-slider', this.props.className);
		return <LL_H_C className={className}>
			{this.renderSliderInput()}
			{this.renderCurrentValue()}
		</LL_H_C>;
	}
}