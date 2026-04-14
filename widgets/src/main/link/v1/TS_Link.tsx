import * as React from 'react';
import '../TS_Link.scss';
import {_className, stopPropagation} from '@nu-art/thunder-core';
import {composeUrl, RouteParams} from '@nu-art/ts-common';

export type UrlTarget = '_blank' | '_self' | '_parent' | '_top';

type Props = React.PropsWithChildren<{
	url: string;
	params?: RouteParams;
	target?: UrlTarget;
	className?: string;
}>;

export class TS_Link
	extends React.Component<Props, any> {

	private handleOnClick = (e: React.MouseEvent) => {
		stopPropagation(e);
		const params = this.props.params ?? {};
		const url = composeUrl(this.props.url, params);
		window.open(url, this.props.target ?? '_self');
	};

	render() {
		const className = _className('ts-link', this.props.className);
		return <div className={className} onClick={this.handleOnClick}>
			{this.props.children}
		</div>;
	}
}
