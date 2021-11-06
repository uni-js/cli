import { Generator } from './spec';
import { ClientManagerGenerator } from './client-manager';
import { ClientControllerGenerator } from './client-controller';
import Path from 'path';
import * as FileSystem from 'fs-extra';
import { parseTypescriptToAst, printTypeScriptAstSource } from '../recast';

export const TEMPLATE = `
import { createClientSideModule } from '{MODULE_SPEC_PATH}';

export const NewModule = createClientSideModule({
	controllers: [],
	managers: [],
});
`;

export class ClientModuleGenerator extends Generator {
	getRequiredOptionNames(): string[] {
		return ['module'];
	}
	getRequiredConfigNames(): string[] {
		return ['clientModulePath', 'moduleSpecPath'];
	}
	getNames(): string[] {
		return ['client-module-generator', 'cmo'];
	}
	async generate(): Promise<void> {
		const clientManagerGenerator = new ClientManagerGenerator(this.config);
		const clientControllerGenerator = new ClientControllerGenerator(this.config);
		const fullDirPath = this.getModuleDirPath();

		await FileSystem.ensureDir(fullDirPath);

		clientManagerGenerator.setOption({
			modulePath: this.option.modulePath || '',
			module: this.option.module,
			name: this.option.module,
		});

		clientControllerGenerator.setOption({
			modulePath: this.option.modulePath || '',
			module: this.option.module,
			name: this.option.module,
		});

		await FileSystem.writeFile(this.getIndexFilePath(), this.generatorIndexFileSource());
		await clientManagerGenerator.generate();
		await clientControllerGenerator.generate();
	}

	private getModuleDirPath(): string {
		return this.getFullPathFromSource(
			Path.join(this.config.clientModulePath, this.option.modulePath || '', `${this.option.module}-module`),
		);
	}
	private getIndexFilePath(): string {
		return Path.join(this.getModuleDirPath(), 'module-export.ts');
	}

	private generatorIndexFileSource(): string {
		const ast = parseTypescriptToAst(TEMPLATE);

		ast.program.body[0].source.value = this.getImportPath(
			this.getIndexFilePath(),
			this.getFullPathFromSource(this.config.moduleSpecPath),
		);

		return printTypeScriptAstSource(ast);
	}
}
