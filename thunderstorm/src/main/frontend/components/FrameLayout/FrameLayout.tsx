import * as React from 'react';
import {Component, HTMLProps, ReactNode} from 'react';
import './FrameLayout.scss';
import {_className} from '../../utils/tools';


export class FrameLayout
	extends Component<HTMLProps<HTMLDivElement> & { children: ReactNode }, any> {

	render() {
		const {children, ...props} = this.props;
		return <div {...props} className={_className(props.className, 'frame-layout')}>
			{children}
		</div>;
	}
}
