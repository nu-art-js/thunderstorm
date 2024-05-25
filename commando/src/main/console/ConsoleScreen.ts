import {ConsoleContainer} from './ConsoleContainer';
import {Widgets} from 'neo-blessed';


type ScreenKeyBinding = {
	keys: string[];
	callback: VoidFunction;
};

/**
 * An abstract class representing a screen container for Blessed widgets with state management and key bindings.
 *
 * @template State - The type of the state object.
 */
export abstract class ConsoleScreen<State extends object>
	extends ConsoleContainer<'screen', State> {
	/**
	 * Creates an instance of ConsoleScreen.
	 *
	 * @param {Widgets.IScreenOptions} [props] - The properties to apply to the screen widget.
	 * @param {ScreenKeyBinding[]} [keyBinding] - An array of key bindings for the screen widget.
	 */
	constructor(props?: Widgets.IScreenOptions, keyBinding: ScreenKeyBinding[] = []) {
		super('screen', props, keyBinding);
	}

}
