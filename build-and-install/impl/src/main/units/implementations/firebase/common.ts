import {LogTypes} from '@nu-art/commando';
import {Logger, LogLevel} from '@nu-art/ts-common';
import {CommandoException} from '@nu-art/commando';
import {CommandoInteractive} from '@nu-art/commando';

const warn = ['missing required API'];
const info = ['=== Deploying', 'functions: Successfully deployed function'];
const infoStartsWith = ['✔ ', 'i '];

export const deployLogFilter = (log: string, std: LogTypes) => {
	if (log.startsWith('⚠ ') || warn.find(str => log.includes(str)))
		return LogLevel.Warning;

	if (infoStartsWith.find(str => log.startsWith(str)) || info.find(str => log.includes(str)))
		return LogLevel.Info;

	if (log.includes('Error:'))
		return LogLevel.Error;

	return LogLevel.Debug;
};

/**
 * Ensures an Artifact Registry repository exists, creating it if it doesn't.
 *
 * **Process**:
 * 1. Attempts to describe the repository to check if it exists
 * 2. If repository doesn't exist (NOT_FOUND), creates it with the specified format
 * 3. Ignores "already exists" errors during creation
 *
 * **Repository Formats**:
 * - `'docker'`: For Docker container images (uses `-docker.pkg.dev` domain)
 * - `'generic'`: For generic packages like tarballs (uses `-pkg.dev` domain)
 *
 * @param commando - CommandoInteractive instance for executing gcloud commands
 * @param artifactRegistry - Artifact Registry configuration
 * @param repositoryFormat - Repository format ('docker' or 'generic')
 * @param logger - Logger instance for logging messages
 */
export async function ensureArtifactRegistryRepository(
	commando: CommandoInteractive,
	artifactRegistry: { region: string; repository: string; projectId: string },
	repositoryFormat: 'docker' | 'generic',
	logger: Logger
): Promise<void> {
	const {region, repository, projectId} = artifactRegistry;

	// Check if repository exists
	logger.logDebug(`Checking if Artifact Registry repository exists: ${repository} in ${region}`);
	const repositoryExists = await commando
		.append(`gcloud artifacts repositories describe ${repository} --location=${region} --project=${projectId}`)
		.execute((stdout, stderr, exitCode) => {
			if (exitCode === 0)
				return true;

			// Check if error is NOT_FOUND
			if (stderr.includes('NOT_FOUND') || stderr.includes('not found'))
				return false;

			// Other errors should be thrown
			throw new CommandoException(`Failed to check repository existence (exit code ${exitCode})`, stdout, stderr, exitCode);
		});

	if (repositoryExists)
		return logger.logDebug(`Repository ${repository} already exists`);

	// Repository doesn't exist, create it
	logger.logInfo(`Creating Artifact Registry repository: ${repository} (format: ${repositoryFormat})`);
	await commando
		.append(`gcloud artifacts repositories create ${repository} --repository-format=${repositoryFormat} --location=${region} --project=${projectId} --description="Repository for ${repositoryFormat} artifacts"`)
		.execute((stdout, stderr, exitCode) => {
			if (exitCode === 0) {
				logger.logInfo(`Successfully created repository: ${repository}`);
				return;
			}
			// Check if error is "already exists" (might have been created between check and create)
			if (stderr.includes('already exists') || stderr.includes('ALREADY_EXISTS')) {
				logger.logDebug(`Repository ${repository} already exists (created concurrently)`);
				return;
			}
			throw new CommandoException(`Failed to create repository (exit code ${exitCode})`, stdout, stderr, exitCode);
		});
}
