import {BadImplementationException} from '@nu-art/ts-common';
import * as React from 'react';

type ScrollBehavior = 'smooth' | 'auto'

const extractElement = (element: React.RefObject<HTMLElement> | HTMLElement): HTMLElement => {
	return element instanceof HTMLElement ? element as HTMLElement : element.current as HTMLElement;
};

export const scrollIntoView = (_child: React.RefObject<HTMLElement> | HTMLElement, _container: React.RefObject<HTMLElement> | HTMLElement, scrollBehavior: ScrollBehavior = 'smooth') => {
	const child = extractElement(_child);
	const container = extractElement(_container);
	if (!child || !container)
		throw new BadImplementationException('Got no elements');

	const childRect = child.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();

	const inView = (childRect.top >= containerRect.top) && (childRect.bottom <= containerRect.top + container.clientHeight);
	if (!inView) {
		const scrollTop = childRect.top - containerRect.top;
		const scrollBot = childRect.bottom - containerRect.bottom;
		let scroll = container.scrollTop;
		if (Math.abs(scrollTop) < Math.abs(scrollBot))
			scroll += scrollTop - 35;
		else
			scroll += scrollBot;

		container.scroll({top: scroll, behavior: scrollBehavior});
	}
};

export const scrollIntoView_Horizontal = (_child: React.RefObject<HTMLElement> | HTMLElement, _container: React.RefObject<HTMLElement> | HTMLElement, scrollBehavior: ScrollBehavior = 'smooth') => {
	const child = extractElement(_child);
	const container = extractElement(_container);
	if (!child || !container)
		throw new BadImplementationException('Got no elements');

	const childRect = child.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();

	const inView = (childRect.left >= containerRect.left) && (childRect.right <= containerRect.left + container.clientWidth);
	if (!inView) {
		const scrollLeft = childRect.left - containerRect.left;
		const scrollRight = childRect.right - containerRect.right;
		let scroll = container.scrollLeft;
		if (Math.abs(scrollLeft) < Math.abs(scrollRight))
			scroll += scrollLeft - 35;
		else
			scroll += scrollRight;

		container.scroll({left: scroll, behavior: scrollBehavior});
	}
};

export const scrollToTop = (_child: React.RefObject<HTMLElement> | HTMLElement, _container: React.RefObject<HTMLElement> | HTMLElement, scrollBehavior: ScrollBehavior = 'smooth', offset: number = 0) => {
	const child = extractElement(_child);
	const container = extractElement(_container);
	if (!child || !container)
		throw new BadImplementationException('Got no elements');

	const childRect = child.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();

	if (childRect.top === containerRect.top)
		return;

	let scroll = container.scrollTop;
	scroll += childRect.top - containerRect.top - offset;
	container.scroll({top: scroll, behavior: scrollBehavior});
};