/*
 * Thunderstorm form package.
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ComponentType} from 'react';
import {_keys} from '@nu-art/ts-common';
import {EditableItem, UIProps_EditableItem} from '@nu-art/editable-item';
import {ComponentSync, TS_PropRenderer} from '@nu-art/thunder-widgets';

export type Props_FormV3<T> = {
	className?: string;
	editable: EditableItem<T>;
	renderers: {
		[K in keyof T]?: {
			label: string;
			editor: ComponentType<UIProps_EditableItem<any, any, T[K]>>;
		};
	};
};

type State_FormV3<T> = {
	editable: EditableItem<T>;
};

export class Component_FormV3<T>
	extends ComponentSync<Props_FormV3<T>, State_FormV3<T>> {
	static defaultProps = {};

	constructor(p: Props_FormV3<T>) {
		super(p);
		this.state = {editable: p.editable};
	}

	protected deriveStateFromProps(nextProps: Props_FormV3<T>, state: State_FormV3<T>): State_FormV3<T> {
		state.editable = nextProps.editable;
		return state;
	}

	render() {
		const editable = this.state.editable;
		return (
			<div className={`ll_v_c ${this.props.className}`} style={{justifyContent: 'space-evenly'}}>
				{_keys(this.props.renderers).map(key => this.renderField(editable, key))}
			</div>
		);
	}

	private renderField<K extends keyof T>(editable: EditableItem<T>, prop: K) {
		const renderer = this.props.renderers[prop]!;
		const Editor = renderer.editor;
		return (
			<TS_PropRenderer.Vertical key={String(prop)} label={renderer.label}>
				<Editor editable={editable} prop={prop}/>
			</TS_PropRenderer.Vertical>
		);
	}
}
