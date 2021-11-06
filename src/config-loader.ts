import packageDirectory from 'pkg-dir';
import { readJSON, pathExists } from 'fs-extra';
import * as Path from 'path';

const CONFIG_FILE_NAME = 'uni-cli.json';

export async function loadConfig(): Promise<any> {
	const packageDir = await packageDirectory();
	const configFilePath = Path.join(packageDir, CONFIG_FILE_NAME);

	if ((await pathExists(configFilePath)) === false) {
		throw new Error(`please add a config file: ${CONFIG_FILE_NAME} in your package folder`);
	}

	try {
		const config = await readJSON(configFilePath);
		return config;
	} catch (err) {
		throw new Error(`not a json format config file: ${CONFIG_FILE_NAME}`);
	}
}
