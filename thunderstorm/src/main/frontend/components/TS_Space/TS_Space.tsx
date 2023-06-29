import * as React from 'react';
import {_className} from '../../utils/tools';


export class TS_Space
	extends React.Component<{ className?: string, height?: number | string, width?: number | string }> {

	render() {
		return <div className={_className('ts-space', this.props.className)} style={{height: this.props.height || '100%', width: this.props.width || '100%'}}/>;
	}
}