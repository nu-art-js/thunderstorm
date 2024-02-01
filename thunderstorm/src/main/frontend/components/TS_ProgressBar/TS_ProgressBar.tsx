import {BadImplementationException} from '@nu-art/ts-common';
import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_ProgressBar.scss';
import {_className} from '../../utils/tools';

export type TS_ProgressBar_Type = 'linear-bar' | 'radial';

type Props = {
	ratios: number[];
	type: TS_ProgressBar_Type;
	radius: number;
	className?: string;
	onClick?: VoidFunction;
};

type State = {
	percentages: number[];
};

export class TS_ProgressBar
	extends ComponentSync<Props, State> {

	static defaultProps: Partial<Props> = {
		type: 'linear-bar',
		radius: 30,
	};

	protected deriveStateFromProps(nextProps: Props, state: State) {
		nextProps.ratios.forEach(ratio => {
			if (ratio < 0 || ratio > 1)
				throw new BadImplementationException('Ratio passed must be normalized to 0 < ratio < 1');
		});

		state.percentages = nextProps.ratios.map(ratio => Math.floor(ratio * 100));
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
			{this.state.percentages.map((percentage, i) => {
				return <React.Fragment key={i}>
					<div className={'ts-progress-bar__linear-bar__text'}>{percentage}%</div>
					<div className={'ts-progress-bar__linear-bar__bar'} style={{width: `${percentage}%`}}>
						<div className={'ts-progress-bar__linear-bar__text'}>{percentage}%</div>
					</div>
				</React.Fragment>;
			})}
		</div>;
	};

	private renderRadialBar = () => {
		const radius = this.props.radius;
		const strokeDashArray = 2 * Math.PI * radius;
		const lastPercentage = this.state.percentages[this.state.percentages.length - 1];
		return <div className={'ts-progress-bar__radial-bar'}>
			<div className={'ts-progress-bar__radial-bar__text'}>{lastPercentage}%</div>
			<svg className="ts-progress-bar__radial-bar__bar" viewBox={'0 0 100 100'}>
				<circle cx="50" cy="50" r={radius} className={'ts-progress-bar__radial-bar__bar__background'}/>
				{this.state.percentages.map((percentage, i) => {
					const strokeDashOffset = strokeDashArray - (strokeDashArray * this.props.ratios[i]);
					return <circle key={i} cx="50" cy="50" r={radius} className={`ts-progress-bar__radial-bar__bar-child-${i}`} strokeDasharray={strokeDashArray}
												 strokeDashoffset={strokeDashOffset}/>;
				})}
			</svg>
		</div>;
	};

	render() {
		const className = _className('ts-progress-bar', this.props.className);
		const Renderer = this.getRenderer();
		return <div className={className} onClick={this.props.onClick}>
			<Renderer/>
		</div>;
	}
}