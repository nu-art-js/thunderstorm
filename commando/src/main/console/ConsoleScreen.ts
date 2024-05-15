// @ts-ignore
import * as blessed from 'neo-blessed';

import {mergeObject, ResolvableContent} from '@nu-art/ts-common';
import {BoxOptions, ScreenOptions, WidgetTypes} from './types';


export abstract class ConsoleScreen<State extends object> {

	protected state!: State;
	private screen: any;
	protected readonly widgets: any[] = [];

	constructor(props?: ScreenOptions) {
		this.screen = blessed.screen(props);

		props?.keyBinding?.map(keyBinding => {
			this.screen.key(keyBinding.keys, keyBinding.callback);
		});
	}

	setState(state: ResolvableContent<Partial<State>>) {
		this.state = mergeObject(this.state, state);
		this._render();
		return this;
	}

	createWidget(type: WidgetTypes, props: Omit<BoxOptions, 'parent'>) {
		const widget = blessed[type]({...props, parent: this.screen});
		this.widgets.push(widget);
		return widget;
	}

	getFocusedWidget() {
		return this.screen.focused;
	}

	private _render() {
		this.screen.render();
		this.render();
	}

	// this for inheriting and rendering the state according to the widgets
	protected abstract render(): void ;

	enable() {
		this.widgets.forEach(widget => {
			widget.focusable = true;
			widget.interactive = true;
		});
		this._render();
	}

	disable() {
		this.widgets.forEach(widget => {
			widget.focusable = false;
			widget.interactive = false;
		});
		this._render();
	}

	/**
	 * Clears all widgets from the screen and optionally clears the screen.
	 */
	clearScreen(clearContent: boolean = true) {
		this.widgets.forEach(widget => widget.detach());
		// @ts-ignore
		this.widgets = [];
	}
}