import {ConsoleScreen} from '../../../main/console/ConsoleScreen';


export class TestConsole_UpdatingContent
	extends ConsoleScreen<{ content: string }> {
	private box: any;

	constructor() {
		super({
			mouse: true,  // Enable mouse handling
		});
	}

	protected createContent() {
		this.box = this.createWidget('box', {
			top: '0',
			left: 'center',
			width: '50%',
			height: '50%',
			mouse: true,
			scrollable: true,
			border: {type: 'line', fg: 2	},
			style: {
				fg: 'green',
				bg: 'white',
				border: {
					type: 'line',
					fg: 'white'
				}
			}
		});
	}

	protected render(): void {
		this.box.setContent(this.state.content);
	}

	runTest() {
		let content = '';
		let index = 1;
		const helloWorldLovelyWeatherToday = 'Hello, world!\nLovely weather today...';
		for (const char of helloWorldLovelyWeatherToday) {
			const stateContent = content += char;
			setTimeout(() => {
				this.setState({content: stateContent});

				if (stateContent?.length >= helloWorldLovelyWeatherToday.length) {
					setTimeout(() => {
						this.dispose();
						this.setState({content: ''});
						setTimeout(() => {
							this.create().runTest();
						}, 2000);
					}, 1000);
				}
			}, 200 * index++);
		}
	}
}
