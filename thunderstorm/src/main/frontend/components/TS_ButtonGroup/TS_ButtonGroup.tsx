import * as React from 'react';
import {ThisShouldNotHappenException} from '@nu-art/ts-common';
import './TS_ButtonGroup.scss';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import {TS_ButtonV2} from '../TS_ButtonV2/TS_ButtonV2';
import {InferProps, InferState} from '../../utils/types';
import {ButtonGroup_Props, ButtonGroup_Props_Controlled, ButtonGroup_State, ButtonGroupItem, ButtonGroupItem_NonControlled} from './types';

export class TS_ButtonGroup<ButtonKey extends string = string>
	extends ComponentSync<ButtonGroup_Props<ButtonKey>, ButtonGroup_State<ButtonKey>> {

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		if (nextProps.controlled) { //Logic for controlled group
			state.selectedKey = nextProps.selectedKey;
		} else { //Logic for non-controlled group
			state.selectedKey ??= nextProps.defaultButtonKey;
		}
		state.buttons = nextProps.buttons;
		state.className = nextProps.className;
		return state;
	}

	//################################### Logic ###################################

	private handleClick = async (e: React.MouseEvent<HTMLDivElement>, buttonKey: ButtonKey) => {
		if (this.state.actionInProgress || this.state.selectedKey === buttonKey)
			return;

		if (this.props.controlled)
			return this.handleClick_Controlled(e, buttonKey);

		return this.handleClick_NonControlled(e, buttonKey);
	};

	private handleClick_Controlled = async (e: React.MouseEvent<HTMLDivElement>, buttonKey: ButtonKey) => {
		const result = (this.props as ButtonGroup_Props_Controlled<ButtonKey>).clickCallback(buttonKey);
		//Sync operation - just return
		if (!(result instanceof Promise))
			return;

		//Async operation - Return a promise to trigger button loader
		return new Promise<void>((resolve) => {
			//Set in progress for this component
			this.setState({actionInProgress: true}, async () => {
				try {
					//Await the result
					await result;
				} catch (err: any) {
					this.logError(err);
				} finally {
					//Set not in progress, resolve the promise
					// @ts-ignore - prevents race conditions
					this.state.actionInProgress = false;
					this.forceUpdate();
					resolve();
					// this.setState({actionInProgress: false}, () => resolve());
				}
			});
		});
	};

	private handleClick_NonControlled = async (e: React.MouseEvent<HTMLDivElement>, buttonKey: ButtonKey) => {
		const button = this.state.buttons.find(button => button.key === buttonKey) as ButtonGroupItem_NonControlled<ButtonKey>;
		if (!button)
			throw new ThisShouldNotHappenException(`Got to handle click with button key ${buttonKey}, but no button with this key exists in the state`);

		const result = button.onClick(e);
		//Sync operation - just return
		if (!(result instanceof Promise))
			return;

		//Async operation - Return a promise to trigger button loader
		return new Promise<void>((resolve) => {
			//Set in progress for this component
			this.setState({actionInProgress: true}, async () => {
				try {
					//Await the result
					await result;
					//Set not in progress, switch the selected button key, resolve the promise
					this.setState({actionInProgress: false, selectedKey: buttonKey}, () => resolve());
				} catch (err: any) {
					this.logError(e);
					//Set not in progress, resolve the promise
					this.setState({actionInProgress: false}, () => resolve());
				}
			});
		});
	};

	//################################### Render ###################################

	private renderButton = (button: ButtonGroupItem<ButtonKey, boolean>, index: number) => {
		const selectedButton = button.key === this.state.selectedKey;

		// when async operation is ongoing all should be disabled
		const disableButtons = button.disabled || this.state.actionInProgress;
		const buttonClassName = _className(selectedButton && 'selected', button.className);
		const separatorClassName = _className('separator', selectedButton && 'invisible');

		return <React.Fragment key={button.key}>
			{(index !== 0) && <div className={separatorClassName}/>}
			<TS_ButtonV2
				className={buttonClassName}
				id={`button-${button.key}`}
				onClick={e => this.handleClick(e, button.key)}
				disabled={disableButtons}
			>
				{button.label}
			</TS_ButtonV2>
		</React.Fragment>;
	};

	render() {
		const className = _className('ts-button-group', this.props.direction, this.state.className);
		return <div className={className}>
			{
				this.props.buttons.map((button, index) => this.renderButton(button, index))
			}
		</div>;
	}
}