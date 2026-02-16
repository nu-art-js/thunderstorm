import * as React from 'react';
import {_className, stopPropagation} from '@nu-art/thunder-core';
import {composeUrl, RouteParams} from '@nu-art/ts-common';
import '../TS_Link.scss';

export type UrlTarget = '_blank' | '_self' | '_parent' | '_top';

type Props = React.PropsWithChildren<{
	url: string;
	params?: RouteParams;
	target?: UrlTarget;
	className?: string;
}>;

export function TS_Link(props: Props): React.ReactElement {
	const {url, params = {}, target = '_self', className, children} = props;
	const handleClick = (e: React.MouseEvent) => {
		stopPropagation(e);
		window.open(composeUrl(url, params), target);
	};
	return (
		<div className={_className('ts-link', className)} onClick={handleClick}>
			{children}
		</div>
	);
}
