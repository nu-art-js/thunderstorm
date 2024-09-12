import * as React from 'react';
import {ComponentSync, LL_H_C} from '@nu-art/thunderstorm/frontend';
import {currentTimeMillis, Second} from '@nu-art/ts-common';

type Props = {
	blockedUntil: number,
	hide: VoidFunction
}

type State = {
	blockedUntil: number;
	timeLeft: number;
}

export class Component_LoginBlocked
	extends ComponentSync<Props, State> {
	private timerInterval!: NodeJS.Timeout;

	componentDidMount() {
		this.timerInterval = setInterval(this.updateTimeLeft, Second);
	}

	componentWillUnmount() {
		clearInterval(this.timerInterval);
	}

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.blockedUntil = nextProps.blockedUntil;
		state.timeLeft = state.blockedUntil - currentTimeMillis();
		return state;
	}

	private updateTimeLeft = () => {
		const newTimeLeft = this.state.blockedUntil - currentTimeMillis();
		if (newTimeLeft <= 0) {
			clearInterval(this.timerInterval);
			return this.props.hide();
		}

		this.setState({timeLeft: newTimeLeft});
	};

	private renderBlockedTimer = () => {
		const totalSeconds = Math.floor(this.state.timeLeft / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

		return `${minutes}:${formattedSeconds}`;
	};

	render() {
		return <LL_H_C className={'login-blocked'}>
			Login blocked, try again in: {this.renderBlockedTimer()}
		</LL_H_C>;
	}
}