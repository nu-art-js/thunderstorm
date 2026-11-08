import {expect} from 'chai';
import {mongoAtlasLocalContainerPort, mongoAtlasLocalImage, mongoEmuContainerBaseName, mongoEmuContainerName, mongoReplicaSetEnsureEval, mongoTestContainerNoFile, mongoTestContainerReadySeconds, mongoTestContainerRunCommand, mongoTestReplicaSetCommand} from '../../main/units/implementations/firebase/mongo-emulator.js';


describe('mongo emulator naming', () => {
	it('qualifies the container by port so two clones do not share a name', () => {
		expect(mongoEmuContainerBaseName('@app/beamz-backend')).to.equal('mongo-emu--app-beamz-backend');
		expect(mongoEmuContainerName('@app/beamz-backend', 27219)).to.equal('mongo-emu--app-beamz-backend-27219');
		expect(mongoEmuContainerName('@app/beamz-backend', 27019)).to.equal('mongo-emu--app-beamz-backend-27019');
	});
});

describe('mongoReplicaSetEnsureEval', () => {
	it('waits for the Atlas local primary and stays one line', () => {
		const evalJs = mongoReplicaSetEnsureEval(27219);
		expect(evalJs).to.include('PRIMARY ready');
		expect(evalJs).to.include('rs.status()');
		expect(evalJs).to.not.include('rs.reconfig');
		expect(evalJs).to.not.include('rs.initiate');
		expect(evalJs).to.not.include('\n');
		expect(JSON.stringify(evalJs)).to.not.include('\\n');
		expect(evalJs).to.include('sleep(2)');
		expect(evalJs).to.not.include('sleep(200)');
		expect(evalJs).to.include('Date.now()+60000');
	});
});

describe('mongoTestContainerRunCommand', () => {
	it('publishes the host port onto the Atlas local listen port', () => {
		const command = mongoTestContainerRunCommand('mongo-test--app-knowledge-tree-backend', 27019);
		expect(mongoTestContainerNoFile).to.equal(64000);
		expect(mongoAtlasLocalContainerPort).to.equal(27017);
		expect(command).to.equal(`docker run -d --name mongo-test--app-knowledge-tree-backend --ulimit nofile=64000:64000 -p 27019:${mongoAtlasLocalContainerPort} ${mongoAtlasLocalImage}`);
	});
});

describe('mongoTestReplicaSetCommand', () => {
	it('polls mongosh on the container listen port and prints the container log', () => {
		const command = mongoTestReplicaSetCommand('mongo-test--app-knowledge-tree-backend', 27019);
		expect(command).to.not.include('\n');
		expect(command).to.include('sleep 2');
		expect(command).to.include(`SECONDS+${mongoTestContainerReadySeconds}`);
		expect(command).to.include('docker logs');
		expect(command).to.include('mongo-test--app-knowledge-tree-backend');
		expect(command).to.include(`mongosh --port ${mongoAtlasLocalContainerPort}`);
		expect(command).to.include('sleep(2)');
	});
});
