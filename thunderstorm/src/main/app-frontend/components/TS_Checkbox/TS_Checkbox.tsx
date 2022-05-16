import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import './TS_Checkbox.scss';

export type Props_Checkbox = {
	id?: string
	disabled?: boolean
	rounded?: boolean
	checked?: boolean
	onCheck?: (checked: boolean, e: React.MouseEvent<HTMLDivElement>) => void
}

type State_Checkbox = {
	checked: boolean
}

export class TS_Checkbox
	extends ComponentSync<Props_Checkbox, State_Checkbox> {

	constructor(p: Props_Checkbox) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props_Checkbox): State_Checkbox | undefined {
		return {checked: nextProps.checked || false};
	}

	render() {
		let onClick: undefined | ((checked: boolean, e: React.MouseEvent<HTMLDivElement>) => void);
		if (!this.props.disabled)
			onClick = this.props.onCheck;

		const checkedClass = this.props.checked && 'ts-checkbox__checked' || 'ts-checkbox__unchecked';
		const disabledClass = this.props.disabled && 'ts-checkbox__disabled';
		const roundedClass = this.props.rounded && 'ts-checkbox__rounded';
		const className = _className('ts-checkbox', disabledClass, checkedClass, roundedClass);
		const innerClassName = _className('ts-checkbox__inner', disabledClass, checkedClass, roundedClass);

		return <div
			id={this.props.id}
			className={className}
			onClick={!this.props.disabled ? (e) => onClick?.(!this.props.checked, e) : undefined}>
			<div className={innerClassName}/>
		</div>;
	}
}
