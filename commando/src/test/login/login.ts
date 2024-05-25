import {ConsoleScreen} from '../../main/console/ConsoleScreen';


interface UserInputScreenState {
	username: string;
	email: string;
	logMessages: string;
}

export class UserInputScreen
	extends ConsoleScreen<UserInputScreenState> {
	private userName: any;
	private email: any;
	private logWidget: any;

	constructor() {
		super({
				smartCSR: true,
				title: 'User Input Example',
			}, [
				{
					keys: ['tab'],  // Example to navigate through widgets
					callback: () => this.navigateWidgets()
				},
				{
					keys: ['C-enter'],  // Example to submit form with Enter key
					callback: () => {
						this.updateLog(`Submitting using Keyboard, input Username: ${this.state.username}, Email: ${this.state.email}`);
					}
				},
				{
					keys: ['C-c'],  // Example to submit form with Enter key
					callback: () => process.exit(0)
				}
			]
		);
		this.state = {
			username: '',
			email: '',
			logMessages: ''
		};
	}

	protected createContent() {
		// Username input
		this.userName = this.createWidget('textbox', {
			top: 2,
			left: 'center',
			width: '50%',
			height: 3,
			keys: true,
			label: ' Username ',
			border: {type: 'line'},
			style: {focus: {border: {fg: 'blue'}}, border: {fg: '#000000'}, hover: {border: {fg: 'green'}}}
		});
		this.userName.on('submit', (username: string) => {
			this.setState({username});
			this.updateLog(`Username set to ${username}`);
		});
		this.userName.focus();

		// Email input
		this.email = this.createWidget('textbox', {
			top: 6,
			left: 'center',
			width: '50%',
			height: 3,
			keys: true,
			label: ' Email ',
			border: {type: 'line'},
			style: {focus: {border: {fg: 'blue'}}, border: {fg: 'gray'}, hover: {border: {fg: '#ff0000'}}}
		});
		this.email.on('submit', (email: string) => {
			this.setState({email});
			this.updateLog(`Email set to ${email}`);
		});

		// Submit button
		const button = this.createWidget('button', {
			top: 10,
			left: 'center',
			width: '20%',
			height: 3,
			content: 'Submit',
			align: 'center',
			valign: 'middle',
			mouse: true,
			style: {focus: {fg: 'white', bg: 'green'}, hover: {fg: 'red'}}
		});
		button.on('click', (e: any) => {
			if (e.button === 'left')
				this.updateLog(`Submitting using Mouse, input Username: ${this.state.username}, Email: ${this.state.email}`);
		});
		// 	this.setState({email});
		// button.on('submit', (email: string) => {
		// 	this.updateLog(`Email set to ${email}`);
		// });

		// Log box for output messages
		this.logWidget = this.createWidget('log', {
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

	render() {
		this.userName.setContent(this.state.username);
		this.email.setContent(this.state.email);
		this.logWidget.setContent(this.state.logMessages);
	}

	private navigateWidgets = () => {
		// Implement cycling focus among input fields and buttons
		const focusableWidgets = this.widgets.filter(widget => widget.focusable);
		const currentIndex = focusableWidgets.indexOf(this.getFocusedWidget());
		const nextIndex = (currentIndex + 1) % focusableWidgets.length;
		const elementToFocus = focusableWidgets[nextIndex];
		('focus' in elementToFocus) && elementToFocus.focus();
	};

	private updateLog(log: string) {
		this.setState({logMessages: this.state.logMessages + `${log}\n`});
		// Imagine processing the form here
	}
}