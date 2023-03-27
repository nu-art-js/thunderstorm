import * as React from 'react';
import {CSSProperties, HTMLProps} from 'react';
import './_Layouts.scss';
import {_className} from '../../utils/tools';


export type LinearLayoutProps =
	React.PropsWithChildren<HTMLProps<HTMLDivElement>>
	& { ref?: React.Ref<any>, innerRef?: React.Ref<HTMLDivElement>, style?: CSSProperties };

class LinearLayout
	extends React.Component<LinearLayoutProps> {
	private layoutClass: string;

	constructor(props: LinearLayoutProps, layoutClass: string) {
		super(props);
		this.layoutClass = layoutClass;
	}

	render() {
		const {innerRef, ...props} = this.props;

		return <div
			{...props}
			ref={innerRef}
			className={_className(this.layoutClass, props.className)}>
			{props.children}
		</div>;
	}
}

export class LL_V_L
	extends LinearLayout {
	constructor(props: LinearLayoutProps) {
		super(props, 'll_v_l');
	}
}

export class LL_V_C
	extends LinearLayout {
	constructor(props: LinearLayoutProps) {
		super(props, 'll_v_c');
	}
}

export class LL_V_R
	extends LinearLayout {
	constructor(props: LinearLayoutProps) {
		super(props, 'll_v_r');
	}
}

export class LL_H_T
	extends LinearLayout {
	constructor(props: LinearLayoutProps) {
		super(props, 'll_h_t');
	}
}

export class LL_H_C
	extends LinearLayout {
	constructor(props: LinearLayoutProps) {
		super(props, 'll_h_c');
	}
}

export class LL_H_B
	extends LinearLayout {
	constructor(props: LinearLayoutProps) {
		super(props, 'll_h_b');
	}
}

export class LL_VH_C
	extends LinearLayout {
	constructor(props: LinearLayoutProps) {
		super(props, 'll_v_c match_height flex__justify-center');
	}
}
