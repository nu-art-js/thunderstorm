import {expect} from 'chai';
import {mongoEmuContainerBaseName, mongoEmuContainerName, mongoReplicaSetEnsureEval} from '../../main/units/implementations/firebase/mongo-emulator.js';


describe('mongo emulator naming', () => {
	it('qualifies the container by port so two clones do not share a name', () => {
		expect(mongoEmuContainerBaseName('@app/beamz-backend')).to.equal('mongo-emu--app-beamz-backend');
		expect(mongoEmuContainerName('@app/beamz-backend', 27219)).to.equal('mongo-emu--app-beamz-backend-27219');
		expect(mongoEmuContainerName('@app/beamz-backend', 27019)).to.equal('mongo-emu--app-beamz-backend-27019');
	});
});

describe('mongoReplicaSetEnsureEval', () => {
	it('reconfigs an existing replica set onto the current listen port', () => {
		const evalJs = mongoReplicaSetEnsureEval(27219);
		expect(evalJs).to.include('localhost:27219');
		expect(evalJs).to.include('InvalidReplicaSetConfig');
		expect(evalJs).to.include('AlreadyInitialized');
		expect(evalJs).to.include('rs.reconfig');
		expect(evalJs).to.include('rs.initiate');
		expect(evalJs).to.not.include('\n');
		expect(JSON.stringify(evalJs)).to.not.include('\\n');
	});
});
