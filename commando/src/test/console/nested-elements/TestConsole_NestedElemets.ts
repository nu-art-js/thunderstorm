import {ConsoleScreen} from '../../main/console/ConsoleScreen';
import {ConsoleContainer} from '../../main/console/ConsoleContainer';
import {BlessedWidget, BlessedWidgetOptions} from '../../main/console/types';


type BoxState = { options: string[], title: string };

class BoxContainer
	extends ConsoleContainer<'box', BoxState> {
	private list!: BlessedWidget['list'];

	constructor(props: BlessedWidgetOptions['box']) {
		super('box', props);
		this.state = {options: ['Option 1', 'Option 2', 'Option 3'], title: 'Welcome to the application!'};
	}

	createContent() {
		this.createWidget('text', {
			top: 2,
			left: 2,
			width: '50%',
			height: '50%'
		});
		this.list = this.createWidget('list', {
			top: '50%',
			left: 2,
			width: '50%',
			height: '50%',
			keys: true,
			mouse: true
		});
	}

	protected render() {
		this.list.setItems(this.state.options);
	}
}

type LogState = { log: string };

class LogContainer
	extends ConsoleContainer<'log', LogState> {
	private logElement!: BlessedWidget['log'];

	constructor(props: BlessedWidgetOptions['log']) {
		super('log', props);
	}

	createContent() {
		this.logElement = this.createWidget('log', {
			content: 'Logs will appear here...',
			interactive: false,
		});
	}

	protected render() {
		this.logElement.setContent(this.state.log);
	}
}

type FormState = { input: string };

class FormContainer
	extends ConsoleContainer<'form', FormState> {
	private input!: BlessedWidget['textbox'];

	constructor(props: BlessedWidgetOptions['form']) {
		super('form');
	}

	createContent() {
		this.input = this.createWidget('textbox', {
			label: 'Input',
			inputOnFocus: true,
			top: 2,
			left: 2,
			width: '75%',
			height: 3,
		});
		this.createWidget('button', {
			content: 'Submit',
			top: 2,
			left: '80%',
			width: '18%',
			height: 3,
			shrink: true,
			mouse: true,
			style: {
				focus: {bg: 'red'},
				hover: {bg: 'blue'}
			}
		});
	}

	protected render() {
		this.input.setContent(this.state.input);
	}
}

// Main application class that sets up the entire UI
export class Application
	extends ConsoleScreen<FormState & BoxState & LogState> {
	private boxContainer!: BoxContainer;
	private logContainer!: LogContainer;
	private formContainer!: FormContainer;

	createContent() {
		this.addContainer(this.boxContainer = new BoxContainer({top: '0%', left: '0%', width: '100%', height: '33%', label: 'Top Box'}));
		this.addContainer(this.logContainer = new LogContainer({top: '33%', left: '0%', width: '100%', height: '33%', label: 'Log'}));
		this.addContainer(this.formContainer = new FormContainer({top: '66%', left: '0%', width: '100%', height: '33%', label: 'Form'}));
	}

	propagateState() {
		this.boxContainer.setState({
			title: this.state.title,
			options: this.state.options,

		});
		this.logContainer.setState({
			log: this.state.log,
		});
		this.formContainer.setState({
			input: this.state.input,
		});
	}

	render() {
	}
}

