/** Docker name without port — leftover from single-stack; still rm'd so a relaunch does not collide. */
export const mongoEmuContainerBaseName = (unitKey: string): string =>
	`mongo-emu-${unitKey.replace(/[^a-z0-9-]/gi, '-')}`;

/** Port-qualified name so two clones on different PORT_MONGO do not docker-rm each other. */
export const mongoEmuContainerName = (unitKey: string, port: number): string =>
	`${mongoEmuContainerBaseName(unitKey)}-${port}`;

/**
 * mongosh --eval body: initiate if needed, reconfig member host when the data dir
 * was last used on another port (InvalidReplicaSetConfig / AlreadyInitialized).
 */
export const mongoReplicaSetEnsureEval = (port: number): string => {
	const host = `localhost:${port}`;
	// One line: JSON.stringify for the shell turns real newlines into \\n, which mongosh
	// then parses as JS source (SyntaxError: Expecting Unicode escape sequence).
	return [
		`const host=${JSON.stringify(host)};`,
		`function waitPrimary(){const deadline=Date.now()+30000;while(Date.now()<deadline){try{if(rs.status().members.some(m=>m.stateStr==='PRIMARY')){print('PRIMARY ready');return;}}catch(e){}sleep(2);}throw new Error('timeout waiting for PRIMARY');}`,
		`function alignHost(){const cfg=rs.conf();if(cfg.members[0].host!==host){cfg.members[0].host=host;cfg.version=cfg.version+1;rs.reconfig(cfg,{force:true});}}`,
		`try{rs.status();alignHost();}catch(e){const msg=String((e&&e.codeName)||(e&&e.message)||e);if(/AlreadyInitialized|InvalidReplicaSetConfig|already initialized/i.test(msg)){alignHost();}else{try{rs.initiate({_id:'rs0',members:[{_id:0,host:host}]});}catch(e2){if(!/AlreadyInitialized|already initialized/i.test(String(e2.message||e2)))throw e2;alignHost();}}}`,
		`waitPrimary();`,
	].join('');
};

/**
 * This host starts a container as uid 1000 unless `--user` is set.
 * `/data/db` belongs to `mongodb`, so uid 1000 cannot create `/data/db/journal`.
 */
export const mongoTestContainerRunCommand = (containerName: string, port: number): string =>
	`docker run -d --user mongodb --name ${containerName} -p ${port}:${port} mongo:7 --replSet rs0 --port ${port}`;

/**
 * One shell line. Commando backgrounds the command with `&`, and `&` applies to the last line only.
 * Poll every 2s. At 30s, print the container log and fail. Then initiate and wait for a primary the same way.
 */
export const mongoTestReplicaSetCommand = (containerName: string, port: number): string => {
	const name = `'${containerName.replace(/'/g, `'\\''`)}'`;
	const evalArg = JSON.stringify(mongoReplicaSetEnsureEval(port));
	const giveUp = `docker logs ${name} >&2 || true`;
	return `deadline=$((SECONDS+30)); until docker exec ${name} mongosh --port ${port} --quiet --eval "print(1)"; do if [ "$SECONDS" -ge "$deadline" ]; then ${giveUp}; echo "Mongo did not answer within 30s" >&2; exit 1; fi; sleep 2; done; docker exec ${name} mongosh --port ${port} --quiet --eval ${evalArg} || { ${giveUp}; echo "Mongo did not become primary within 30s" >&2; exit 1; }`;
};
