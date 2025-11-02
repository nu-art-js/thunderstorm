import {Component, HTMLProps, ReactNode} from 'react';
import './RelativeLayout.scss';
import {_className} from '../../utils/tools.js';


export class RelativeLayout
	extends Component<HTMLProps<HTMLDivElement> & { children: ReactNode }, any> {

	render() {
		const {children, ...props} = this.props;
		return <div {...props} className={_className(props.className, 'relative-layout')}>
			{children}
		</div>;
	}
}
