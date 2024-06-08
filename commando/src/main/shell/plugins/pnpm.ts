import {BaseCommando} from '../core/BaseCommando';
import {MergeClass} from '../core/class-merger';
import {Commando_Basic} from './basic';
import {Commando_Programming} from './programming';
import {Commando_NVM} from './nvm';


const Super = MergeClass(BaseCommando, Commando_Programming, Commando_Basic, Commando_NVM);

export class Commando_PNPM
	extends Super {

	async installPackages() {
		await this
			.append(`pnpm store prune`)
			.append(`pnpm install -f --no-frozen-lockfile --prefer-offline false`)
			.execute();

		return this;
	}

	async install(version: string) {
		await this
			.append(`curl -fsSL "https://get.pnpm.io/install.sh" | env PNPM_VERSION=${version} bash -`)
			.execute();

		return this;
	}

	async getVersion() {
		return this.if('[[ -x "$(command -v pnpm)" ]]', (commando) => {
			commando.append('pnpm --version');
		}).execute(stdout => stdout.trim());
	}

}