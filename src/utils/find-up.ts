import path from 'path';
import locatePath from 'locate-path';

export interface Option {
	limit?: number;
	stopAt?: string;
	cwd?: string;
}

export async function findUp(name: string, options: Option = {}) {
	let directory = path.resolve(options.cwd || '');
	const { root } = path.parse(directory);
	const stopAt = path.resolve(directory, options.stopAt || root);
	const limit = 1;
	const paths = [name].flat();

	const runMatcher = async (locateOptions: any) => {
		return locatePath(paths, locateOptions);
	};

	const matches = [];
	while (true) {
		const foundPath = await runMatcher({ ...options, cwd: directory });

		if (foundPath) {
			matches.push(path.resolve(directory, foundPath));
		}

		if (directory === stopAt || matches.length >= limit) {
			break;
		}

		directory = path.dirname(directory);
	}

	return matches[0];
}
