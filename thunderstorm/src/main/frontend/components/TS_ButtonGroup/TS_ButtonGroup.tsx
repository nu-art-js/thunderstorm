import * as React from 'react';
import {exists, ResolvableContent} from '@nu-art/ts-common';
import './TS_ButtonGroup.scss';
import { ComponentSync } from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import {TS_ButtonV2} from '../TS_ButtonV2/TS_ButtonV2';

export type ButtonGroupItem = { key: string, label: string, disabled?: boolean, className?: string }

type Props = {
	buttons: ButtonGroupItem[];
	clickCallback: (key: string) => Promise<void> | void;
	direction: 'horizontal' | 'vertical';

	//optionals
	className?: string;
	loaderRenderer?: ResolvableContent<React.ReactNode>
}

type State = {
	selectedKey: string; // the currently selected item in group
	actionInProgressKey?: string | false;
}

export class TS_ButtonGroup
	extends ComponentSync<Props, State> {


	protected deriveStateFromProps(nextProps: Props, state: State): State {
		// Set selected key as the first value on first render
		state.selectedKey ??= nextProps.buttons[0].key;
		return state;
	}

	//################################### Logic ###################################

	private updateKey = (newKey: string) => {
		return this.setState({selectedKey: newKey, actionInProgressKey: undefined});
	};

	private handleClick = (key: string) => {
		if (this.state.selectedKey === key || exists(this.state.actionInProgressKey))
			return;

		const result = this.props.clickCallback(key);
		if (!(result instanceof Promise)) {
			return this.updateKey(key);
		}

		this.setState({actionInProgressKey: key}, async () => {
			try {
				await result;
				this.updateKey(key);
			} catch (error: any) {
				this.logError(error);
			}
		});
	};

	//################################### Render ###################################

	private renderButton = (button: ButtonGroupItem, index: number) => {
		const selectedButton = button.key === this.state.selectedKey;
		const actionInProgressKey = this.state.actionInProgressKey;
		const inProgress = actionInProgressKey === button.key;

		// when async operation is ongoing all should be disabled
		const disableButton = button.disabled || exists(actionInProgressKey) && actionInProgressKey !== button.key;
		const buttonClassName = _className(selectedButton && 'selected', disableButton && 'disabled', button.className);
		const separatorClassName = _className('separator', selectedButton && 'invisible');

		return <React.Fragment key={index}>
			{(index !== 0) && <div className={separatorClassName}/>}
			<TS_ButtonV2
				className={buttonClassName}
				onClick={() => this.handleClick(button.key)}
				disabled={disableButton}
				actionInProgress={inProgress}
			>
				{button.label}
			</TS_ButtonV2>
		</React.Fragment>;
	};

	render() {
		const className = _className('ts-button-group', this.props.direction);
		return <div className={className}>
			{
				this.props.buttons.map((button, index) => this.renderButton(button, index))
			}
		</div>;
	}
}

