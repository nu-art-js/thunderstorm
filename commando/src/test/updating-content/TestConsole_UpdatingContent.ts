import {ConsoleScreen} from '../../main/console/ConsoleScreen';
import {BoxOptions} from '../../main/console/types';


export class TestConsole_UpdatingContent
	extends ConsoleScreen<{ content: string }> {
	private box: any;

	constructor() {
		super({
			mouse: true,  // Enable mouse handling
		});

		const boxOptions: BoxOptions = {
			top: '0',
			left: 'center',
			width: '50%',
			height: '50%',
			mouse: true,
			scrollable: true,
			border: {type: 'line', fg: '#FFFFFF'},
			style: {
				fg: 'green',
				bg: 'white',
				border: {
					type: 'line',
					fg: 'white'
				}
			}
		};

		// Create a box widget
		this.box = this.createWidget('box', boxOptions);

	}

	// Implement the abstract render method, even if it does nothing for now
	protected render(): void {
		this.box.setContent(this.state.content);
		// This can be left empty or used to update UI elements based on state changes
	}

	/**
	 * Test method to create a box widget and render it.
	 */
	printConsole() {
		// Optionally, add assertions or checks here to validate the existence and properties of the box
		console.log('Box created and rendered with content:', this.box.getContent());
	}
}
