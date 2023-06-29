import {BadImplementationException} from '@nu-art/ts-common';
import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_ProgressBar.scss';

export type TS_ProgressBar_Type = 'linear-bar' | 'radial';

type Props = {
	ratio: number;
	type: TS_ProgressBar_Type;
	radius: number;
};

type State = {
	percentage: number;
};

export class TS_ProgressBar
	extends ComponentSync<Props, State> {

	static defaultProps: Partial<Props> = {
		type: 'linear-bar',
		radius: 30,
	};

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state ??= this.state ? {...this.state} : {} as State;
		if (nextProps.ratio < 0 || nextProps.ratio > 1)
			throw new BadImplementationException('Ratio passed must be normalized to 0 < ratio < 1');
		
		state.percentage = Math.floor(nextProps.ratio * 100);
		return state;
	}

	private getRenderer() {
		switch (this.props.type) {
			case 'linear-bar':
				return this.renderLinearBar;

			case 'radial':
				return this.renderRadialBar;
		}
	}

	private renderLinearBar = () => {
		return <div className={'ts-progress-bar__linear-bar'}>
			<div className={'ts-progress-bar__linear-bar__text'}>{this.state.percentage}%</div>
			<div className={'ts-progress-bar__linear-bar__bar'} style={{width: `${this.state.percentage}%`}}>
				<div className={'ts-progress-bar__linear-bar__text'}>{this.state.percentage}%</div>
			</div>
		</div>;
	};

	private renderRadialBar = () => {
		const radius = this.props.radius;
		const strokeDashArray = 2 * Math.PI * radius;
		const strokeDashOffset = strokeDashArray - (strokeDashArray * this.props.ratio);
		return <div className={'ts-progress-bar__radial-bar'}>
			<div className={'ts-progress-bar__radial-bar__text'}>{this.state.percentage}%</div>
			<svg className="ts-progress-bar__radial-bar__bar" viewBox={'0 0 100 100'}>
				<circle cx="50" cy="50" r="30" strokeDasharray={strokeDashArray} strokeDashoffset={strokeDashOffset}/>
			</svg>
		</div>;
	};

	render() {
		const Renderer = this.getRenderer();
		return <div className={'ts-progress-bar'}>
			<Renderer/>
		</div>;
	}
}