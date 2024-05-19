// @ts-ignore
import * as blessed from 'neo-blessed';

import {Logger, mergeObject, ResolvableContent} from '@nu-art/ts-common';
import {BoxOptions, ScreenOptions, WidgetTypes} from './types';


export abstract class ConsoleScreen<State extends object>
	extends Logger {

	private readonly screenProps: ScreenOptions | undefined;
	private enabled = false;
	protected state: State = {} as State;
	private screen: any;
	protected readonly widgets: any[] = [];

	constructor(props?: ScreenOptions) {
		super(props?.title);
		this.screenProps = props;
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

	private createScreen() {
		if (this.screen)
			return this.logWarning(`will not create screen, already exists!`);

		this.screen = blessed.screen(this.screenProps);
		this.screenProps?.keyBinding?.map(keyBinding => {
			this.screen.key(keyBinding.keys, keyBinding.callback);
		});
	}

	private _createWidgets() {
		if (this.widgets.length > 0)
			return this.logWarning(`will not create widgets, already have ${this.widgets.length} widgets!`);

		this.createWidgets();
	}

	protected abstract createWidgets(): void;

	readonly create = () => {
		this.createScreen();
		this._createWidgets();
		if (!this.enabled)
			this.resume();

		return this;
	};

	readonly resume = () => {
		this.enabled = true;
		this.widgets.forEach(widget => {
			widget.focusable = true;
			widget.interactive = true;
		});

		this._render();
		return this;
	};

	private _render() {
		if (!this.enabled)
			return;

		this.screen.render();
		this.render();
	}

	// this for inheriting and rendering the state according to the widgets
	protected abstract render(): void ;

	readonly pause = () => {
		this.enabled = false;
		this.widgets.forEach(widget => {
			widget.focusable = false;
			widget.interactive = false;
		});
		return this;
	};

	readonly dispose = () => {

		this.widgets.forEach(widget => widget.detach());
		// @ts-ignore
		this.widgets = [];
		this._render();
		if (this.enabled)
			this.pause();
		return this;
	};

	readonly releaseScreen = () => {
		if(!this.screen)
			return;

		this.screen.detach();
		this.screen.clear();
		this.screen.destroy();
	}
}