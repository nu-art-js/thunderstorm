import * as React from 'react';
import {AppToolsScreen} from '../../components/TS_AppTools';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_Button} from '../../components/TS_Button';
import {ModuleFE_FirebaseListener} from '@nu-art/firebase/frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';


type State = {};

export class ATS_FirebaseListener
	extends ComponentSync<{}, State> {

	static defaultProps = {};

	static screen: AppToolsScreen = {
		name: 'Firebase Listener',
		key: 'firebase-listener',
		renderer: this,
		group: 'Firebase Functionality Test'
	};

	protected deriveStateFromProps(nextProps: {}, state: Partial<State>): State {
		return state;
	}

	private startListening = () => {
		const ref = ModuleFE_FirebaseListener.createListener('harel');
		this.logInfo("?")
		ref.startListening(snapshot => {
			const data = snapshot.val();
			this.logInfo(`Received Value: ${data}`);
			this.logInfo(`Key: ${snapshot.key}`);
			this.logInfo(`Size: ${snapshot.size}`);
			this.logInfo(`Exists: ${snapshot.exists()}`);
			this.logInfo(`ExportVal: ${snapshot.exportVal()}`);
			this.logInfo(`HasChildren: ${snapshot.hasChildren()}`);
			this.logInfo(`Priority: ${snapshot.priority}`);
		});
	};

	render() {
		return <div>
			<TS_Button onClick={this.startListening}>
				Start Listening
			</TS_Button>
		</div>;
	}
}