/*
 * @nu-art/thunder-core - Shallow window resize listener
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export interface OnWindowResized {
	__onWindowResized(): void;
}

const listeners = new Set<OnWindowResized>();
let bound = false;

function onResize() {
	listeners.forEach(l => {
		try {
			l.__onWindowResized();
		} catch (e) {
			console.error('OnWindowResized listener error:', e);
		}
	});
}

function bind() {
	if (bound || typeof window === 'undefined')
		return;
	bound = true;
	window.addEventListener('resize', onResize);
}

export function addWindowResizeListener(listener: OnWindowResized): void {
	listeners.add(listener);
	bind();
}

export function removeWindowResizeListener(listener: OnWindowResized): void {
	listeners.delete(listener);
}
