/** Docker name without port — leftover from single-stack; still rm'd so a relaunch does not collide. */
export const mongoEmuContainerBaseName = (unitKey: string): string =>
	`mongo-emu-${unitKey.replace(/[^a-z0-9-]/gi, '-')}`;

/** Port-qualified name so two clones on different PORT_MONGO do not docker-rm each other. */
export const mongoEmuContainerName = (unitKey: string, port: number): string =>
	`${mongoEmuContainerBaseName(unitKey)}-${port}`;

/**
 * mongosh --eval body. The Atlas local image already runs one replica set.
 * The host client uses directConnection, so this only waits for a primary.
 * One line: JSON.stringify for the shell turns real newlines into \\n, which mongosh
 * then parses as JS source (SyntaxError: Expecting Unicode escape sequence).
 */
export const mongoReplicaSetEnsureEval = (_port: number): string => {
	return [
		`function waitPrimary(){const deadline=Date.now()+60000;while(Date.now()<deadline){try{if(rs.status().members.some(m=>m.stateStr==='PRIMARY')){print('PRIMARY ready');return;}}catch(e){}sleep(2);}throw new Error('timeout waiting for PRIMARY');}`,
		`waitPrimary();`,
	].join('');
};

/**
 * MongoDB asks for 64000 open files.
 * Docker gives the container a soft limit of 1024.
 * WiredTiger keeps each table file open until 2000 handles, so 1024 kills mongod first.
 */
export const mongoTestContainerNoFile = 64000;

/** Atlas local listens on 27017. The host port is the left side of the publish map. */
export const mongoAtlasLocalImage = 'mongodb/mongodb-atlas-local';
export const mongoAtlasLocalContainerPort = 27017;

/** How long the host waits for mongosh inside the Atlas local container. */
export const mongoTestContainerReadySeconds = 120;

/** Detached Atlas local Mongo. The nofile limit is on the container, not the host. */
export const mongoTestContainerRunCommand = (containerName: string, port: number): string =>
	`docker run -d --name ${containerName} --ulimit nofile=${mongoTestContainerNoFile}:${mongoTestContainerNoFile} -p ${port}:${mongoAtlasLocalContainerPort} ${mongoAtlasLocalImage}`;

/**
 * One shell line. Commando backgrounds the command with `&`, and `&` applies to the last line only.
 * Poll every 2s. At the deadline, print the container log and fail. Then wait for a primary.
 * mongosh uses the container listen port. The published host port stays on the client URL.
 */
export const mongoTestReplicaSetCommand = (containerName: string, port: number): string => {
	const name = `'${containerName.replace(/'/g, `'\\''`)}'`;
	const evalArg = JSON.stringify(mongoReplicaSetEnsureEval(port));
	const giveUp = `docker logs ${name} >&2 || true`;
	const listen = mongoAtlasLocalContainerPort;
	return `deadline=$((SECONDS+${mongoTestContainerReadySeconds})); until docker exec ${name} mongosh --port ${listen} --quiet --eval "print(1)"; do if [ "$SECONDS" -ge "$deadline" ]; then ${giveUp}; echo "Mongo did not answer within ${mongoTestContainerReadySeconds}s" >&2; exit 1; fi; sleep 2; done; docker exec ${name} mongosh --port ${listen} --quiet --eval ${evalArg} || { ${giveUp}; echo "Mongo did not become primary within ${mongoTestContainerReadySeconds}s" >&2; exit 1; }`;
};
