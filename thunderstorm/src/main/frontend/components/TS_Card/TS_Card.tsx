import * as React from 'react';
import {_className} from '../../utils/tools';
import './TS_Card.scss';
import {TS_ErrorBoundary} from '../TS_ErrorBoundary';


export class TS_Card
	extends React.Component<React.HTMLAttributes<HTMLDivElement>> {

	shouldComponentUpdate(): boolean {
		return true;
	}

	render() {
		const {children, className, ...rest} = this.props;
		return <div {...rest} className={_className('ts-card', className)}>
			<TS_ErrorBoundary>
				{children}
			</TS_ErrorBoundary>
		</div>;
	}
}