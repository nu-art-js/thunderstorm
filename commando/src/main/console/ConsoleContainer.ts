import {Logger, mergeObject, ResolvableContent} from '@nu-art/ts-common';
import {BlessedWidget, BlessedWidgetOptions, BlessedWidgetsType, createBlessedWidget} from './types';
import {Widgets} from 'blessed';
import INodeOptions = Widgets.INodeOptions;


type KeyBinding = {
	keys: string[];
	callback: VoidFunction;
};

/**
 * An abstract class representing a container for Blessed widgets with state management and key bindings.
 *
 * @template Type - The type of the Blessed widget.
 * @template State - The type of the state object.
 */
export abstract class ConsoleContainer<Type extends BlessedWidgetsType, State extends object = {}>
	extends Logger {
	private readonly containerProps?: BlessedWidgetOptions[Type];
	private readonly keyBinding: KeyBinding[];
	private enabled = false;
	protected state: State = {} as State;
	protected container!: BlessedWidget[Type];
	protected type: Type;
	protected readonly widgets: BlessedWidget[BlessedWidgetsType][] = [];

	/**
	 * Creates an instance of ConsoleContainer.
	 *
	 * @param {Type} type - The type of the container widget.
	 * @param {BlessedWidgetOptions[Type]} [containerProps] - The properties to apply to the container widget.
	 * @param {KeyBinding[]} [keyBinding] - An array of key bindings for the container widget.
	 */
	protected constructor(type: Type, containerProps?: BlessedWidgetOptions[Type], keyBinding: KeyBinding[] = []) {
		super((containerProps as INodeOptions)?.name);
		this.type = type;
		this.keyBinding = keyBinding;
		this.containerProps = containerProps;
	}

	/**
	 * Sets the state of the container and triggers a re-render.
	 *
	 * @param {ResolvableContent<Partial<State>>} state - The new state to set.
	 * @returns {this} The current instance for method chaining.
	 */
	setState(state: ResolvableContent<Partial<State>>): this {
		this.state = mergeObject(this.state, state);
		this._render();
		return this;
	}

	/**
	 * Creates a Blessed widget of the specified type and adds it to the container.
	 *
	 * @template WidgetType - The type of the widget to create.
	 * @param {WidgetType} type - The type of the widget to create.
	 * @param {BlessedWidgetOptions[WidgetType]} props - The properties to apply to the widget.
	 * @returns {BlessedWidget[WidgetType]} The created widget.
	 */
	createWidget<WidgetType extends BlessedWidgetsType>(type: WidgetType, props: BlessedWidgetOptions[WidgetType]): BlessedWidget[WidgetType] {
		const widget = createBlessedWidget(type, props, this.container);
		this.widgets.push(widget);
		return widget;
	}

	/**
	 * Gets the currently focused widget within the container.
	 *
	 * @returns {Widgets.Node} The focused widget.
	 */
	getFocusedWidget(): BlessedWidget[BlessedWidgetsType] {
		return this.container.screen.focused;
	}

	private createContainer() {
		if (this.container) {
			return this.logWarning('Container already exists!');
		}

		try {
			this.container = createBlessedWidget(this.type, this.containerProps, this.container);
			this.keyBinding.forEach(keyBinding => {
				this.container.key(keyBinding.keys, keyBinding.callback);
			});
		} catch (error: any) {
			this.logError('Failed to create container:', error);
		}
	}

	private _createWidgets() {
		if (this.widgets.length > 0) {
			this.logWarning(`Widgets already created (${this.widgets.length} widgets)!`);
			return;
		}

		this.createContent();
	}

	/**
	 * Creates the widgets within the container.
	 * This method should be implemented by subclasses to define the specific widgets to create.
	 */
	protected abstract createContent(): void;

	/**
	 * Creates the container and its widgets, and resumes rendering if not already enabled.
	 *
	 * @returns {this} The current instance for method chaining.
	 */
	readonly create = (): this => {
		this.createContainer();
		this._createWidgets();
		if (!this.enabled)
			this.resume();

		return this;
	};

	/**
	 * Resumes rendering and enables focus on the widgets.
	 *
	 * @returns {this} The current instance for method chaining.
	 */
	readonly resume = (): this => {
		this.enabled = true;
		this.widgets.forEach(widget => {
			widget.focusable = true;
		});

		this._render();
		return this;
	};

	private _render() {
		if (!this.enabled)
			return;

		this.render();
		this.container.screen.render();
	}

	/**
	 * Renders the container.
	 * This method should be implemented by subclasses to define the specific rendering logic.
	 */
	protected abstract render(): void;

	/**
	 * Pauses rendering and disables focus on the widgets.
	 *
	 * @returns {this} The current instance for method chaining.
	 */
	readonly pause = (): this => {
		this.enabled = false;
		this.widgets.forEach(widget => {
			widget.focusable = false;
		});
		return this;
	};

	/**
	 * Disposes of the container and its widgets.
	 *
	 * @returns {this} The current instance for method chaining.
	 */
	readonly dispose = (): this => {
		if (!this.container)
			return this;

		this.widgets.forEach(widget => widget.detach());
		this.widgets.length = 0;
		this._render();
		if (this.enabled)
			this.pause();

		this.container.detach();
		this.container.destroy();
		// @ts-ignore
		this.container = null;

		return this;
	};

}