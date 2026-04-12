/**
 * returns if a given element is a flex container
 * @param element - element to check
 * @returns boolean
 */
export function isFlexbox(element: HTMLElement): boolean {
	const style = window.getComputedStyle(element);
	return style.display === 'flex' || style.display === 'inline-flex';
}

/**
 * returns the amount of rows a wrapping flex container currently has
 * if the given container is not a flexbox returns -1
 * @param container - the flex container
 * @returns number
 */
export function getFlexboxRowCount(container: HTMLElement): number {
	if (!isFlexbox(container))
		return -1;

	const children = Array.from(container.children) as HTMLElement[];
	if (!children.length)
		return 0;

	let baseOffset: number = children[0].offsetTop;
	let rowCount = 1;
	children.forEach(child => {
		if (child.offsetTop > baseOffset) {
			baseOffset = child.offsetTop;
			rowCount++;
		}
	});

	return rowCount;
}