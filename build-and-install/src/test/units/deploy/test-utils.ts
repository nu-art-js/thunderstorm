import {execSync} from 'child_process';
import {Logger} from '@nu-art/ts-common';

/**
 * Deletes an Artifact Registry generic package version if it exists.
 *
 * Used in tests to clean up existing versions before uploading, allowing
 * repeated test runs with the same version tag. In production, version
 * uniqueness must be preserved.
 *
 * @param artifactRegistry - Artifact Registry configuration
 * @param packageName - Package name
 * @param version - Version tag to delete
 * @param logger - Optional logger for debug messages
 */
export async function deleteArtifactRegistryVersion(
	artifactRegistry: { region: string; repository: string; projectId: string },
	packageName: string,
	version: string,
	logger: Logger
): Promise<void> {
	const {region, repository, projectId} = artifactRegistry;

	try {
		execSync(
			`gcloud artifacts versions delete ${version} --package=${packageName} --location=${region} --repository=${repository} --project=${projectId} --quiet`,
			{encoding: 'utf-8', stdio: 'pipe'}
		);
		logger.logDebug(`Deleted existing test version ${version} before upload`);
	} catch (error: any) {
		// Ignore if version doesn't exist (expected on first run)
		const stderr = error.stderr?.toString() || '';
		if (stderr.includes('NOT_FOUND') || stderr.includes('not found')) {
			logger.logDebug(`Version ${version} does not exist (expected on first run)`);
			return;
		}
		// Log other errors but don't throw (test should continue)
		logger.logDebug(`Could not delete existing version (may not exist): ${error.message}`);
	}
}

