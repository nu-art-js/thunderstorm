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
		`function waitPrimary(){const deadline=Date.now()+30000;while(Date.now()<deadline){try{if(rs.status().members.some(m=>m.stateStr==='PRIMARY')){print('PRIMARY ready');return;}}catch(e){}sleep(200);}throw new Error('timeout waiting for PRIMARY');}`,
		`function alignHost(){const cfg=rs.conf();if(cfg.members[0].host!==host){cfg.members[0].host=host;cfg.version=cfg.version+1;rs.reconfig(cfg,{force:true});}}`,
		`try{rs.status();alignHost();}catch(e){const msg=String((e&&e.codeName)||(e&&e.message)||e);if(/AlreadyInitialized|InvalidReplicaSetConfig|already initialized/i.test(msg)){alignHost();}else{try{rs.initiate({_id:'rs0',members:[{_id:0,host:host}]});}catch(e2){if(!/AlreadyInitialized|already initialized/i.test(String(e2.message||e2)))throw e2;alignHost();}}}`,
		`waitPrimary();`,
	].join('');
};
