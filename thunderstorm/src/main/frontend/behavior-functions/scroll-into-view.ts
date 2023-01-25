import {BadImplementationException} from '@nu-art/ts-common';
import * as React from 'react';

type ScrollBehavior = 'smooth' | 'auto'

export const scrollIntoView = (child: React.RefObject<HTMLElement>, container: React.RefObject<HTMLElement>, scrollBehavior: ScrollBehavior = 'smooth') => {
	if (!child?.current || !container?.current)
		throw new BadImplementationException('Got refs with no elements');

	const childRect = child.current.getBoundingClientRect();
	const containerRect = container.current.getBoundingClientRect();

	const inView = (childRect.top >= containerRect.top) && (childRect.bottom <= containerRect.top + container.current.clientHeight);
	if (!inView) {
		const scrollTop = childRect.top - containerRect.top;
		const scrollBot = childRect.bottom - containerRect.bottom;
		let scroll = container.current.scrollTop;
		if (Math.abs(scrollTop) < Math.abs(scrollBot))
			scroll += scrollTop - 35;
		else
			scroll += scrollBot;

		container.current.scroll({top: scroll, behavior: scrollBehavior});
	}
};