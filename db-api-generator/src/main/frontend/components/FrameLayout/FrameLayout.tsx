import {Component, HTMLProps, ReactNode} from 'react';
import {_className} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import './FrameLayout.scss';


export class FrameLayout
	extends Component<HTMLProps<HTMLDivElement> & { children: ReactNode }, any> {

	render() {
		const {children, ...props} = this.props;
		return <div {...props} className={_className(props.className, 'frame-layout')}>
			{children}
		</div>;
	}
}
