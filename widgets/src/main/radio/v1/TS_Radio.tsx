import * as React from 'react';
import '../TS_Radio.scss';
import {ComponentSync} from '../../_core/ComponentSync.js';
import {_className, stopPropagation} from '@nu-art/thunder-core';
import {Label} from '../../label/v1/Label.js';

export type Props<ItemType> = {
	values: ItemType[];
	groupName: string;
	checked?: ItemType;
	disabled?: boolean;
	className?: string;
	innerRef?: React.RefObject<HTMLDivElement>;
	labelRenderer?: (value: ItemType) => React.ReactNode;
	labelTooltipContainerSelector?: string;
} & (
	{ canUnselect: true; onCheck?: (value?: ItemType, prevValue?: ItemType) => void }
	| { canUnselect?: false; onCheck?: (value: ItemType, prevValue?: ItemType) => void }
	)

type State<ItemType> = {
	checked?: ItemType;
	disabled?: boolean;
	values: ItemType[];
	labelTooltipContainerSelector?: string;
}

export class TS_Radio<ItemType>
	extends ComponentSync<Props<ItemType>, State<ItemType>> {

	protected deriveStateFromProps(nextProps: Props<ItemType>): State<ItemType> {
		return {
			values: nextProps.values,
			checked: nextProps.checked,
			disabled: nextProps.disabled,
			labelTooltipContainerSelector: nextProps.labelTooltipContainerSelector
		};
	}

	private handleOptionClick = (e: React.MouseEvent<HTMLLabelElement, MouseEvent>, value: ItemType) => {
		stopPropagation(e);
		if (this.state.disabled)
			return;
		const prevValue = this.state.checked;
		const nextValue = (this.props.canUnselect && value === prevValue)
			? undefined
			: value;

		this.setState({checked: nextValue}, () => {
			this.props.onCheck?.(nextValue!, prevValue);
			this.forceUpdate();
		});
	};

	private renderRadioOption = (value: ItemType) => {
		const className = _className('ts-radio__container', (value === this.state.checked ? 'checked' : ''));
		return <label
			key={String(value)}
			htmlFor={`${this.props.groupName}-${value}`}
			className={className}
			onClick={(e) => this.handleOptionClick(e, value)}
		>
			{this.renderRadioButton(value)}
			{this.renderRadioLabel(value)}
		</label>;
	};

	private renderRadioLabel = (value: ItemType) => {
		const renderer = this.props.labelRenderer ?? ((value: ItemType) => String(value));
		const label = renderer(value);
		return <Label className={'ts-radio__label'} tooltip={label} containerSelector={this.state.labelTooltipContainerSelector}>{label}</Label>;
	};

	private renderRadioButton = (value: ItemType) => {
		return <span className={'ts-radio__button'}/>;
	};

	render() {
		const className = _className('ts-radio', this.state?.disabled ? 'disabled' : undefined, this.props.className);
		return <div className={className} ref={this.props.innerRef}>
			{this.props.values.map(value => {
				return this.renderRadioOption(value);
			})}
		</div>;
	}
}
