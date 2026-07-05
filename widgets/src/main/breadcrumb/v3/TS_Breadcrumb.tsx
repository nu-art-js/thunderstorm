import * as React from 'react';
import {Fragment} from 'react';
import {_className} from '@nu-art/thunder-core';
import {ModuleFE_Routing} from '@nu-art/thunder-routing';
import {BadImplementationException} from '@nu-art/ts-common';
import './TS_Breadcrumb.scss';

export type TS_BreadcrumbSegment = {
	label: string;
	routeKey?: string;
};

type Props = {
	segments: TS_BreadcrumbSegment[];
	className?: string;
	ariaLabel?: string;
};

const navigateByRouteKey = (routeKey: string) => {
	const route = ModuleFE_Routing.getRouteByKey(routeKey);
	if (route)
		ModuleFE_Routing.goToRoute(route);
};

export function TS_Breadcrumb(props: Props): React.ReactElement {
	const {segments, className, ariaLabel = 'Page navigation'} = props;

	if (segments.length === 0)
		throw new BadImplementationException('TS_Breadcrumb requires at least one segment');

	return (
		<nav className={_className('ts-breadcrumb', className)} aria-label={ariaLabel}>
			{segments.map((segment, index) => {
				const isLast = index === segments.length - 1;

				return (
					<Fragment key={index}>
						{index > 0 && <span className={'ts-breadcrumb__sep'}>{'›'}</span>}
						{isLast ? (
							<span className={'ts-breadcrumb__current'}>{segment.label}</span>
						) : segment.routeKey ? (
							<button
								type={'button'}
								className={'ts-breadcrumb__link'}
								onClick={() => navigateByRouteKey(segment.routeKey!)}
							>{segment.label}</button>
						) : (
							<span className={'ts-breadcrumb__inert'}>{segment.label}</span>
						)}
					</Fragment>
				);
			})}
		</nav>
	);
}
