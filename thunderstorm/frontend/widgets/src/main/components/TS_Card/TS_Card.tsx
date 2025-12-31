import * as React from 'react';
import {_className} from '@nu-art/thunderstorm-frontend';
import './TS_Card.scss';
import {TS_ErrorBoundary} from '../TS_ErrorBoundary/index.js';
import {LinearLayoutProps} from '../Layouts/index.js';


export class TS_Card
	extends React.Component<LinearLayoutProps> {

	shouldComponentUpdate(): boolean {
		return true;
	}

	render() {
		const {children, className, innerRef, ...rest} = this.props;
		return <div {...rest} className={_className('ts-card', className)}>
			<TS_ErrorBoundary>
				{children}
			</TS_ErrorBoundary>
		</div>;
	}
}