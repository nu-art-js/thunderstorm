import blessed, {Widgets} from 'neo-blessed';


/**
 * A collection of Blessed elements for easy access.
 */
export const BlessedElements = {
	screen: blessed.screen,
	box: blessed.box,
	text: blessed.text,
	list: blessed.list,
	log: blessed.log,
	textarea: blessed.textarea,
	textbox: blessed.textbox,
	form: blessed.form,
	progressbar: blessed.progressbar,
	table: blessed.table,
	listTable: blessed.listtable,
	prompt: blessed.prompt,
	message: blessed.message,
	loading: blessed.loading,
	radioSet: blessed.radioset,
	radiobutton: blessed.radiobutton,
	checkbox: blessed.checkbox,
	input: blessed.input,
	button: blessed.button,
	line: blessed.line,
	scrollableBox: blessed.scrollablebox,
	scrollableText: blessed.scrollabletext,
	terminal: blessed.terminal,
	bigText: blessed.bigtext,
	listBar: blessed.listbar,
	fileManager: blessed.filemanager,
};

type Created = typeof BlessedElements;

/**
 * A type representing the keys of BlessedElements.
 */
export type BlessedWidgetsType = keyof Created;

/**
 * A type representing the options for each Blessed widget.
 */
export type BlessedWidgetOptions = {
	[Type in keyof Created]: Parameters<Created[Type]>[0];
};

/**
 * A type representing each Blessed widget.
 */
export type BlessedWidget = {
	[Type in keyof Created]: ReturnType<Created[Type]>;
};

/**
 * Creates a Blessed widget of the specified type with the given properties and parent node.
 *
 * @template WidgetType - The type of the widget to create.
 * @param {WidgetType} type - The type of the widget to create.
 * @param {BlessedWidgetOptions[WidgetType]} props - The properties to apply to the widget.
 * @param {Widgets.Node} [parent] - The parent node for the widget.
 * @returns {BlessedWidget[WidgetType]} The created widget.
 */
export function createBlessedWidget<WidgetType extends BlessedWidgetsType>(
	type: WidgetType,
	props = {} as BlessedWidgetOptions[WidgetType],
	parent?: Widgets.Node
): BlessedWidget[WidgetType] {
	const element = BlessedElements[type] as (
		(options?: BlessedWidgetOptions[WidgetType]) => BlessedWidget[WidgetType]
		);
	return element({...props, parent});
}