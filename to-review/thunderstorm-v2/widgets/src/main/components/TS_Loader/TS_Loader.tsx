import * as React from 'react';
import {HTMLProps} from 'react';
import './TS_Loader.scss';
import {_className} from '@nu-art/thunder-core';

export class TS_Loader
	extends React.Component<HTMLProps<HTMLDivElement>> {
	render() {
		return <div {...this.props} className={_className('ts-loader', this.props.className)}>
			<div className="ts-loader__content"/>
		</div>;
	}
}
