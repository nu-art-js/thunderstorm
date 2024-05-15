import {ConsoleScreen} from '../../main/console/ConsoleScreen';


export class TestConsole_KeyboardInteraction
	extends ConsoleScreen<{ counter: number }> {
	private box: any;

	constructor() {
		super({
			keyBinding: [{
				keys: ['up'], // Bind the 'up' arrow key
				callback: () => this.incrementCounter() // Callback to increment the counter
			}, {
				keys: ['down'], // Bind the 'up' arrow key
				callback: () => this.decrementCounter() // Callback to increment the counter
			}]
		});

		// Create a box widget
		this.box = this.createWidget('textbox', {
			top: 'center',
			left: 'center',
			width: '50%',
			height: '10%',
			border: {type: 'line'},
			style: {
				fg: 'white',
				bg: 'blue',
				border: {fg: 'green'}
			}
		});

	}

	// Method to increment the counter state.
	private incrementCounter() {
		this.setState({counter: this.state.counter + 1});
	}

	private decrementCounter() {
		this.setState({counter: this.state.counter - 1});
	}

	// Implement the required abstract method to render the state to the UI.
	protected render(): void {
		this.box.setContent(`Counter: ${this.state.counter}`);
	}
}
