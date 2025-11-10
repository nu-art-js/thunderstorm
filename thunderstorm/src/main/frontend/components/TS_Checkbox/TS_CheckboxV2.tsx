import * as React from 'react';
import {exists, generateHex, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {ComponentSync} from '../../core/ComponentSync.js';
import {_className} from '../../utils/tools.js';
import './TS_CheckboxV2.scss';
import {TS_Icons} from '@nu-art/ts-styles';

type IconSpec = {
	checked: ResolvableContent<React.ReactNode>;
	unChecked: ResolvableContent<React.ReactNode>;
	indeterminate: ResolvableContent<React.ReactNode>;
}

type Props = {
	checked: boolean | undefined;
	onCheck: (nextCheckState: boolean) => void;
	label: string;
	disabled?: boolean;
	className?: string;
	id?: string;
	customIcons?: Partial<IconSpec>;
};

type State = {
	checked: boolean | undefined;
	label: string;
	disabled: boolean;
	id: string;
	className?: string;
	customIcons?: Partial<IconSpec>;
};

export class TS_CheckboxV2
	extends ComponentSync<Props, State> {

	private defaultIconSpec: IconSpec = {
		checked: () => <TS_Icons.v.component/>,
		unChecked: () => <TS_Icons.x.component/>,
		indeterminate: () => <TS_Icons.dash.component/>,
	};

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.checked = nextProps.checked;
		state.disabled = !!nextProps.disabled;
		state.label = nextProps.label;
		state.id ??= nextProps.id ?? generateHex(8);
		state.className = nextProps.className;
		state.customIcons = nextProps.customIcons;
		return state;
	}

	//######################### Logic #########################

	private onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const next = e.target.checked;
		e.stopPropagation();
		this.props.onCheck(next);
	};

	private resolveIconNode = () => {
		const spec = this.state.customIcons ?? this.defaultIconSpec;
		return exists(this.state.checked)
			? (this.state.checked
					? spec.checked
					: spec.unChecked
			) : spec.indeterminate;
	};

	//######################### Render #########################

	render() {
		const className = _className('ts-checkbox-v2', this.state.className);
		return <label className={className} onClick={e => e.stopPropagation()}>
			{this.render_Input()}
			{this.render_Icon()}
			{this.render_Label()}
		</label>;
	}

	private render_Input = () => {
		const checked = this.state.checked;
		const ariaChecked = exists(checked) ? (checked ? 'true' : 'false') : 'mixed';
		return <input
			type={'checkbox'}
			id={this.state.id}
			disabled={this.state.disabled}
			onChange={this.onChange}
			checked={!!this.state.checked}
			aria-checked={ariaChecked}
		/>;
	};

	private render_Icon = () => {
		const iconNode = resolveContent(this.resolveIconNode());
		return <span className={'ts-checkbox-v2__icon'}>{iconNode}</span>;
	};

	private render_Label = () => {
		return <span className={'ts-checkbox-v2__label'}>{this.state.label}</span>;
	};
}