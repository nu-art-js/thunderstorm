import {Widgets} from 'neo-blessed';
import {BlessedWidget, BlessedWidgetOptions, BlessedWidgetsType} from './types';
import {BlessedElements} from './consts';

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