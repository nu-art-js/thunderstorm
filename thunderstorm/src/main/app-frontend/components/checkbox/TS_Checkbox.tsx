import * as React from 'react';
import {BaseComponent} from '../../core/BaseComponent';

export type CheckboxBaseProps = {
	id?: string
	disabled?: boolean
	checked: boolean
	label?: string
}

export type CheckboxRenderingProps = CheckboxBaseProps & {
	onClick?: (e: React.MouseEvent<any>) => void
}
type Props_Checkbox = CheckboxBaseProps & {
	onCheck: (checked: boolean, e: React.MouseEvent<HTMLDivElement>) => void
	renderer: (props: CheckboxRenderingProps) => React.ReactNode
}

type State_Checkbox = {
	checked: boolean
}

const CheckboxRenderer_DefaultBase = (borderRadius: string) => (props: CheckboxRenderingProps) => {
	const innerStyle: React.CSSProperties = {
		width: 18,
		height: 18,
		borderRadius,
		boxSizing: 'border-box'
	};

	if (props.checked) {
		innerStyle.background = '#4fa7ff';
		innerStyle.border = `.5px white solid`;
	}

	const boxStyle = {
		borderRadius,
		border: '1px solid #68678d50',
		boxShadow: '0px 0 1px 0px #867979',
	};

	return <div className="ll_h_c">
		<div style={boxStyle}
				 id={props.id}
				 onClick={props.onClick}>
			<div style={innerStyle}/>
		</div>
		{props.label && <div style={{marginInlineStart: 8, marginTop: 1}}>{props.label}</div>}
	</div>;
};

export const CheckboxRenderer_DefaultSquare = CheckboxRenderer_DefaultBase('1px');
export const CheckboxRenderer_DefaultCircle = CheckboxRenderer_DefaultBase('50%');

export class TS_Checkbox
	extends BaseComponent<Props_Checkbox, State_Checkbox> {

	static defaultProps: Partial<Props_Checkbox> = {
		renderer: CheckboxRenderer_DefaultSquare
	};

	constructor(p: Props_Checkbox) {
		super(p);
		this.state = {checked: p.checked};
	}

	protected deriveStateFromProps(nextProps: Props_Checkbox): State_Checkbox | undefined {
		return {checked: nextProps.checked};
	}

	render() {
		let onClick: undefined | ((checked: boolean, e: React.MouseEvent<HTMLDivElement>) => void);
		if (!this.props.disabled)
			onClick = this.props.onCheck;


		const props: CheckboxRenderingProps = {
			id: this.props.id,
			onClick: onClick ? (e) => onClick?.(!this.props.checked, e) : undefined,
			checked: this.state.checked,
			disabled: this.props.disabled,
			label: this.props.label
		};

		return this.props.renderer(props);
	}

}
