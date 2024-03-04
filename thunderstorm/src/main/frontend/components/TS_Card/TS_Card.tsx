import * as React from 'react';
import {_className} from '../../utils/tools';
import './TS_Card.scss';
import {Controller} from '../../core/Controller';

export class TS_Card
	extends Controller<React.HTMLAttributes<HTMLDivElement>> {

	shouldComponentUpdate(): boolean {
		return true;
	}

	render() {
		const {children, className, ...rest} = this.props;
		return <div {...rest} className={_className('ts-card', className)}>
			{children}
		</div>;
	}
}