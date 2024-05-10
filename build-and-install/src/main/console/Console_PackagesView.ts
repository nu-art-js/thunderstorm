// @ts-ignore
import * as blessed from 'neo-blessed';


export class Console_PackagesView {
	private title: string;

	private readonly screen: blessed.Widgets.Screen;
	private readonly titleView: blessed.Widgets.BoxElement;
	// private readonly testBox1: blessed.Widgets.BoxElement;
	// private readonly testBox2: blessed.Widgets.BoxElement;
	// private readonly packageTable: blessed.Widgets.TableElement;

	constructor(title: string) {
		this.title = title;
		this.screen = blessed.screen({
			smartCSR: true,
			title: 'Build and install',
		});

		// Create the UI components
		this.titleView = blessed.box({
			parent: this.screen,
			top: 1,
			left: 'center',
			width: '30%',
			height: 3,
			border: {type: 'line'},
			content: '',
			tags: true,
			style: {
				border: {fg: 'green'},
				fg: 'black',
			},
			valign: 'middle',
			align: 'center'
		});

	}

	public render = () => {
		this.renderTitle();
		this.screen.render();
	};

	renderTitle() {
		this.titleView.setContent(this.title);
	}
}