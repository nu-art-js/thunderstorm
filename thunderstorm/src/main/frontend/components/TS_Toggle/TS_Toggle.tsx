import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import './TS_Toggle.scss';
import {voidFunction} from '@nu-art/ts-common';

type Props = {
	id: string; // to make sure it's unique
	checked: boolean;
	onCheck: (status: boolean) => void;

	//optionals
	disabled?: boolean;
	containerClassName?: string;
	sliderClassName?: string;
}

type State = {
	checked: boolean;
	disabled?: boolean;
}

export class TS_Toggle
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.checked = nextProps.checked;
		state.disabled = nextProps.disabled;
		return state;
	}

	private updateCheckedStatus = (e: React.MouseEvent<HTMLDivElement>) => {
		// fail fast if disabled
		if (this.state.disabled)
			return;

		// we can assume that knowing the structure of this component
		const checkboxElement = e.currentTarget.children[0] as HTMLInputElement;
		return this.props.onCheck(checkboxElement.checked);
	};

	render() {
		const containerClassName = _className('ts-toggle', this.state.disabled && 'disabled', this.props.containerClassName);
		const sliderClassName = _className('ts-toggle__slider', this.state.disabled && 'disabled', this.props.sliderClassName);

		return <div
			id={this.props.id}
			onClick={this.updateCheckedStatus}
			className={containerClassName}
		>
			<input
				onChange={voidFunction}
				className={'ts-toggle__checkbox'}
				type={'checkbox'}
				checked={this.state.checked}
			/>
			<label htmlFor={this.props.id} className={sliderClassName}/>
		</div>;
	}
}