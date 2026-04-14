import * as React from 'react';
import {HTMLProps} from 'react';
import './TS_CircularLoader.scss';
import {_className} from '@nu-art/thunder-core';

/**
 * Circular (spinner) loading indicator.
 */
export class TS_CircularLoader
	extends React.Component<HTMLProps<HTMLDivElement>> {
	render() {
		return <div {...this.props} className={_className('ts-loader', this.props.className)}>
			<div className="ts-loader__content"/>
		</div>;
	}
}

/** @deprecated Use TS_CircularLoader. Kept for backward compatibility. */
export const TS_Loader = TS_CircularLoader;
