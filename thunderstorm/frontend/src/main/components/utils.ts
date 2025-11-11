export function getComputedStyleProperty(el: HTMLElement, property: string, normalValue?: string): string | undefined {
	const computed = document.defaultView?.getComputedStyle(el);
	if (!computed)
		return;

	const value = computed.getPropertyValue(property as string);
	return value === 'normal' ? normalValue ?? value : value;
}