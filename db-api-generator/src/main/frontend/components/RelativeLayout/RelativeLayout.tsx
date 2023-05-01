import {Component, HTMLProps, ReactNode} from 'react';
import {_className} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import './RelativeLayout.scss';


export class RelativeLayout
	extends Component<HTMLProps<HTMLDivElement> & { children: ReactNode }, any> {

	render() {
		const {children, ...props} = this.props;
		return <div {...props} className={_className(props.className, 'relative-layout')}>
			{children}
		</div>;
	}
}
