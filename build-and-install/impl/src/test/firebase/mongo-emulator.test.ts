import {expect} from 'chai';
import {mongoEmuContainerBaseName, mongoEmuContainerName, mongoReplicaSetEnsureEval, mongoTestContainerNoFile, mongoTestContainerRunCommand, mongoTestReplicaSetCommand} from '../../main/units/implementations/firebase/mongo-emulator.js';


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
		expect(evalJs).to.include('sleep(2)');
		expect(evalJs).to.not.include('sleep(200)');
		expect(evalJs).to.include('Date.now()+30000');
	});
});

describe('mongoTestContainerRunCommand', () => {
	it('raises the container file limit above the WiredTiger handle floor', () => {
		const command = mongoTestContainerRunCommand('mongo-test--app-knowledge-tree-backend', 27019);
		expect(mongoTestContainerNoFile).to.equal(64000);
		expect(command).to.equal('docker run -d --name mongo-test--app-knowledge-tree-backend --ulimit nofile=64000:64000 -p 27019:27019 mongo:7 --replSet rs0 --port 27019');
	});
});

describe('mongoTestReplicaSetCommand', () => {
	it('polls every 2s, gives up at 30s, and prints the container log', () => {
		const command = mongoTestReplicaSetCommand('mongo-test--app-knowledge-tree-backend', 27019);
		expect(command).to.not.include('\n');
		expect(command).to.include('sleep 2');
		expect(command).to.include('SECONDS+30');
		expect(command).to.include('docker logs');
		expect(command).to.include('mongo-test--app-knowledge-tree-backend');
		expect(command).to.include('localhost:27019');
		expect(command).to.include('sleep(2)');
	});
});
