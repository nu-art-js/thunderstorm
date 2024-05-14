import {Screen} from '../../main/screen/Screen';


interface UserInputScreenState {
	username: string;
	email: string;
	logMessages: string[];
}

export class UserInputScreen
	extends Screen<UserInputScreenState> {

	constructor() {
		super({
			smartCSR: true,
			title: 'User Input Example',
			keyBinding: [
				{
					keys: ['tab'],  // Example to navigate through widgets
					callback: () => this.navigateWidgets()
				},
				{
					keys: ['C-enter'],  // Example to submit form with Enter key
					callback: () => this.submitForm()
				},
				{
					keys: ['C-c'],  // Example to submit form with Enter key
					callback: () => process.exit(0)
				}
			]
		});
		this.state = {
			username: '',
			email: '',
			logMessages: []
		};

		// Username input
		this.createWidget('textbox', {
			top: 2,
			left: 'center',
			width: '50%',
			height: 3,
			keys: true,
			label: ' Username ',
			border: {type: 'line'},
			style: {focus: {border: {fg: 'blue'}}, border: {fg: 'gray'}}
		}).on('submit', (value: string) => {
			this.setState({username: value});
			this.logMessage(`Username set to ${value}`);
		});

		// Email input
		this.createWidget('textbox', {
			top: 6,
			left: 'center',
			width: '50%',
			height: 3,
			keys: true,
			label: ' Email ',
			border: {type: 'line'},
			style: {focus: {border: {fg: 'blue'}}, border: {fg: 'gray'}, hover: {border: {fg: 'blue'}}}
		}).on('submit', (value: string) => {
			this.setState({email: value});
			this.logMessage(`Email set to ${value}`);
		});

		// Submit button
		this.createWidget('button', {
			top: 10,
			left: 'center',
			width: '20%',
			height: 3,
			content: 'Submit',
			align: 'center',
			valign: 'middle',
			mouse: true,
			style: {focus: {fg: 'white', bg: 'green'}, hover: {fg: 'red'}}
		}).on('click', (e: any) => {
			if (e.button === 'left')
				this.submitForm();
		});

		// Log box for output messages
		this.createWidget('log', {
			top: 14,
			left: 'center',
			width: '80%',
			height: '30%',
			border: {type: 'line'},
			scrollable: true,
			alwaysScroll: true,
			scrollbar: {ch: ' '},
			style: {border: {fg: 'magenta'}}
		});
	}

	render(): void {
	}

	private navigateWidgets = () => {
		// Implement cycling focus among input fields and buttons
		const focusableWidgets = this.widgets.filter(widget => widget.keyable);
		const currentIndex = focusableWidgets.indexOf(this.getFocusedWidget());
		const nextIndex = (currentIndex + 1) % focusableWidgets.length;
		focusableWidgets[nextIndex].focus();
	};

	private logMessage(message: string) {
		this.state.logMessages.push(message);
		const logBox = this.widgets.find(widget => widget.type === 'log');
		logBox.add(message);
		this.render();
	}

	private submitForm() {
		this.logMessage(`Submitting form with Username: ${this.state.username}, Email: ${this.state.email}`);
		// Imagine processing the form here
	}
}

new UserInputScreen().render();