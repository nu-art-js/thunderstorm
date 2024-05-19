/**
 * Styles configuration for the box component.
 */
export type BoxStyle = {
	/** Foreground color. */
	fg?: string;
	/** Background color. */
	bg?: string;
	/** Make text bold. */
	bold?: boolean;
	/** Underline text. */
	underline?: boolean;
	/** Make text blink. */
	blink?: boolean;
	/** Border styling. */
	border?: {
		/** Border type, can be line or background color. */
		type?: 'line' | 'bg';
		/** Border color. */
		fg?: string;
	};
	/** Style when hovered over. */
	hover?: {
		fg?: string;
		bg?: string;
		border?: {
			fg?: string;
			bg?: string;
		};
	};
	/** Style when focused. */
	focus?: {
		fg?: string;
		bg?: string;
		border?: {
			fg?: string;
			bg?: string;
		};
	};
	/** Scrollbar styling. */
	scrollbar?: {
		bg?: string;
		fg?: string;
	};
}

/**
 * Options for configuring a box component in neo-blessed.
 */
export type BoxOptions = {
	/** Parent screen object. */
	parent?: any;
	/** Top position (can be in pixels or percentage). */
	top?: number | string;
	/** Right position (can be in pixels or percentage). */
	right?: number | string;
	/** Bottom position (can be in pixels or percentage). */
	bottom?: number | string;
	/** Left position (can be in pixels or percentage). */
	left?: number | string;
	/** Width of the box (can be in pixels or percentage). */
	width?: number | string;
	/** Height of the box (can be in pixels or percentage). */
	height?: number | string;
	/** Text content of the box. */
	content?: string;
	/** Enables processing of inline tags. */
	tags?: boolean;
	/** Enables key handling for this component. */
	keys?: boolean;
	/** Enables vi-like navigation. */
	vi?: boolean;
	/** Enables mouse interaction. */
	mouse?: boolean;
	/** Makes the box scrollable. */
	scrollable?: boolean;
	/** Always show the scrollbar if the box is scrollable. */
	alwaysScroll?: boolean;
	/** Border configuration. */
	border?: {
		/** Type of border ('line' for lines, 'bg' for background). */
		type: 'line' | 'bg';
		/** Color of the border. */
		fg?: string;
	};
	/** Label text displayed at the top or next to the widget. */
	label?: string;
	/** Styling options for the box. */
	style?: BoxStyle;
	/** Vertical alignment of the content. */
	valign?: 'top' | 'middle' | 'bottom';
	/** Horizontal alignment of the content. */
	align?: 'left' | 'center' | 'right';
	/** Whether the box should respond to input. */
	interactive?: boolean;
	/** Configuration for the scrollbar. */
	scrollbar?: {
		/** Character used to display the scrollbar. */
		ch?: string;
		/** Styling for the track of the scrollbar. */
		track?: {
			bg?: string;
		};
		/** Style adjustments for the scrollbar. */
		style?: {
			inverse?: boolean;
		};
	};
	/** Optional children components, allowing nested structures. */
	children?: BoxOptions[];  // Optional, in case you have nested structures
}

export type ScreenOptions = {
	/** Enables smart cursor routing, optimizing re-rendering. */
	smartCSR?: boolean;
	/** Enables a faster version of smartCSR for high performance rendering. */
	fastCSR?: boolean;
	/** Uses background color erase for reducing flickering. */
	useBCE?: boolean;
	/** Specifies the terminal type. Useful for consistent behavior across terminal types. */
	terminal?: string;
	/** Allows for full Unicode support. */
	fullUnicode?: boolean;
	/** Enables debugging, which logs information about screen operations. */
	debug?: boolean;
	/** Path to a file where debug logs will be written. */
	log?: string;
	/** Sets the terminal window title (not supported by all terminals). */
	title?: string;
	/** Automatically adds padding around the screen content. */
	autoPadding?: boolean;
	/** Controls cursor visibility and behavior. */
	cursor?: {
		artificial?: boolean;  // When true, uses a software cursor
		blink?: boolean;      // Cursor blinks
		shape?: 'block' | 'underline' | 'line';  // Shape of the cursor
	};
	/** Enables mouse interaction support. */
	mouse?: boolean;
	/** Custom input stream for the screen, often used in testing. */
	input?: NodeJS.ReadableStream;
	/** Custom output stream for the screen, often used in testing. */
	output?: NodeJS.WritableStream;
	/** Time in milliseconds to wait after a resize event before redrawing the screen. */
	resizeTimeout?: number;

	keyBinding?: {
		keys: string[],
		callback: VoidFunction
	}[];
}

/**
 * Documentation object simulating an enumeration for widget types.
 */
const WidgetDocs = {
	/** A generic container that can hold other widgets or text. */
	box: null,
	/** Displays static text on the screen. */
	text: null,
	/** Shows a list of selectable items. */
	list: null,
	/** Designed for logging continuous text data. */
	log: null,
	/** A multi-line text input area for user input. */
	textarea: null,
	/** A single-line text input area for user input. */
	textbox: null,
	/** Holds input fields, buttons, and other form-related widgets. */
	form: null,
	/** Displays a progress bar for showing task progress. */
	progressbar: null,
	/** Displays tabular data. */
	table: null,
	/** Extends `list` with table-like functionality. */
	listtable: null,
	/** Prompts the user to input data. */
	prompt: null,
	/** Displays a message box for notifications or alerts. */
	message: null,
	/** Shows a loading spinner or message during operations. */
	loading: null,
	/** For creating groups of radio buttons for options. */
	radioset: null,
	/** A selectable radio button within a radioset. */
	radiobutton: null,
	/** Displays a checkbox that users can toggle. */
	checkbox: null,
	/** A single-line text input for user data. */
	input: null,
	/** A clickable button that can trigger actions. */
	button: null,
	/** A visual separator line. */
	line: null,
	/** A box that supports vertical scrolling of its content. */
	scrollablebox: null
};

export type WidgetTypes = keyof typeof WidgetDocs;