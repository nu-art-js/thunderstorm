import {ConsoleScreen} from '../../main/console/ConsoleScreen';


interface UserInputScreenState {
	username: string;
	email: string;
	logMessages: string[];
}

export class UserInputScreen
	extends ConsoleScreen<UserInputScreenState> {
	private userName: any;
	private email: any;
	private log: any;

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
					callback: () => {
						this.updateLog(`Submitting using Keyboard, input Username: ${this.state.username}, Email: ${this.state.email}`);
					}
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
		this.userName = this.createWidget('textbox', {
			top: 2,
			left: 'center',
			width: '50%',
			height: 3,
			keys: true,
			label: ' Username ',
			border: {type: 'line'},
			style: {focus: {border: {fg: 'blue'}}, border: {fg: 'gray'}}
		}).on('submit', (username: string) => {
			this.setState({username});
			this.updateLog(`Username set to ${username}`);
		});

		// Email input
		this.email = this.createWidget('textbox', {
			top: 6,
			left: 'center',
			width: '50%',
			height: 3,
			keys: true,
			label: ' Email ',
			border: {type: 'line'},
			style: {focus: {border: {fg: 'blue'}}, border: {fg: 'gray'}, hover: {border: {fg: 'blue'}}}
		}).on('submit', (email: string) => {
			this.setState({email});
			this.updateLog(`Email set to ${email}`);
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
				this.updateLog(`Submitting using Mouse, input Username: ${this.state.username}, Email: ${this.state.email}`);
		});

		// Log box for output messages
		this.log = this.createWidget('log', {
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
		this.log.setContent(this.state.logMessages);
	}

	private navigateWidgets = () => {
		// Implement cycling focus among input fields and buttons
		const focusableWidgets = this.widgets.filter(widget => widget.keyable);
		const currentIndex = focusableWidgets.indexOf(this.getFocusedWidget());
		const nextIndex = (currentIndex + 1) % focusableWidgets.length;
		focusableWidgets[nextIndex].focus();
	};

	private updateLog(log: string) {
		this.state.logMessages.push(log);
		this.setState({logMessages: this.state.logMessages});
		// Imagine processing the form here
	}
}