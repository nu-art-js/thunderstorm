import * as React from 'react';
import {ComponentSync, stopPropagation, _className} from '../..';
import './TS_Radio.scss';

type Props<ItemType> = {
	values: ItemType[];
	groupName: string;
	checked?: ItemType;
	onCheck?: (value: ItemType) => void
	disabled?: boolean;
	className?: string;
}

type State<ItemType> = {
	checked?: ItemType;
	disabled?: boolean;
}

export class TS_Radio<ItemType>
	extends ComponentSync<Props<ItemType>, State<ItemType>> {

	// ######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props<ItemType>): State<ItemType> {
		return {
			checked: nextProps.checked || this.state?.checked || undefined,
			disabled: nextProps.disabled,
		};
	}

	// ######################### Logic #########################

	private handleOptionClick = (e: React.MouseEvent<HTMLLabelElement, MouseEvent>, value: ItemType) => {
		stopPropagation(e);
		if (this.state.disabled)
			return;
		this.setState({checked: value}, () => {
			this.props.onCheck?.(value);
			this.forceUpdate();
		});
	};

	// ######################### Render #########################

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
		return <span className={'ts-radio__label'}>{value}</span>;
	};

	private renderRadioButton = (value: ItemType) => {
		return <span className={'ts-radio__button'}/>;
	};

	render() {
		const className = _className('ts-radio', this.state?.disabled ? 'disabled' : undefined, this.props.className);
		return <div className={className}>
			{this.props.values.map(value => {
				return this.renderRadioOption(value);
			})}
		</div>;
	}
}