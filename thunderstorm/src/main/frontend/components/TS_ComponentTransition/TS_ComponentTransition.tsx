import {BadImplementationException} from '@nu-art/ts-common';
import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';

type TransitionPhase = 'mount' | 'enter' | 'enter-done' | 'exit' | 'exit-done' | 'unmount';

type Props = {
	trigger: boolean;
	mountTimeout?: number;
	unmountTimeout?: number;
	transitionTimeout: number;
	transitionPrefix?: string;
	onEnterDone?: () => void;
	onExitDone?: () => void;
}

type State = {
	transitionPhase: TransitionPhase;
}

export class TS_ComponentTransition extends ComponentSync<Props, State> {

	static defaultProps: Partial<Props> = {
		unmountTimeout: 0,
		mountTimeout: 0,
	};

	protected deriveStateFromProps(nextProps: Props): State {
		return {
			transitionPhase: nextProps.trigger ? 'mount' : this.state?.transitionPhase === 'enter-done' ? 'exit' : 'unmount',
		};
	}

	private triggerNextTimeout = () => {
		switch (this.state.transitionPhase) {
			case 'mount':
				setTimeout(() => {
					this.setState({transitionPhase: 'enter'});
				}, this.props.mountTimeout);
				break;

			case 'enter':
				setTimeout(() => {
					this.setState({transitionPhase: 'enter-done'});
					this.props.onEnterDone?.();
				}, this.props.transitionTimeout);
				break;

			case 'exit':
				setTimeout(() => {
					this.setState({transitionPhase: 'exit-done'});
				}, this.props.transitionTimeout);
				break;

			case 'exit-done':
				setTimeout(() => {
					this.setState({transitionPhase: 'unmount'});
				}, this.props.unmountTimeout);
		}
	};

	render() {
		this.triggerNextTimeout();
		if (this.state.transitionPhase === 'unmount')
			return '';

		if (!this.props.children)
			throw new BadImplementationException('Component Expects at least one child');

		return <>
			{React.Children.map(this.props.children, child => {
				return React.cloneElement(child as React.ReactElement, {
					className: _className((child as React.ReactElement).props.className, this.props.transitionPrefix ? `${this.props.transitionPrefix}-${this.state.transitionPhase}` : this.state.transitionPhase),
					style: {transitionDuration: `${this.props.transitionTimeout}ms`}
				});
			})}
		</>;
	}
}