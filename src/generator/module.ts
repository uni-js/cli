import { Generator } from './spec';
import { ClientManagerGenerator } from './client-manager';
import { ClientControllerGenerator } from './client-controller';
import Path from 'path';
import * as FileSystem from 'fs-extra';
import { parseTypescriptToAst, printTypeScriptAstSource } from '../recast';
import { getCamelCaseName } from '../utils';
import { ServerManagerGenerator } from './server-manager';
import { ServerControllerGenerator } from './server-controller';
import * as Recast from 'recast';

export const TEMPLATE = `
import { createModule } from '{MODULE_SPEC_PATH}';

export const NewModule = createModule({
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
		return this.getFullPathFromSource(Path.join(this.config.clientModulePath, this.option.modulePath || '', this.getModuleName()));
	}
	private getIndexFilePath(): string {
		return Path.join(this.getModuleDirPath(), 'module-export.ts');
	}
	private getModuleName(): string {
		return `${this.option.module}-module`;
	}

	private generatorIndexFileSource(): string {
		const ast = parseTypescriptToAst(TEMPLATE);
		const builders = Recast.types.builders;

		ast.program.body[0].source.value = this.getImportPath(
			this.getIndexFilePath(),
			this.getFullPathFromSource(this.config.moduleSpecPath),
		);
		const specifier = ast.program.body[0].specifiers[0];
		specifier.imported = specifier.local = builders.identifier('createServerSideModule');

		ast.program.body[1].declaration.declarations[0].id = getCamelCaseName(this.getModuleName());
		ast.program.body[1].declaration.declarations[0].init.callee.name = 'createClientSideModule';

		return printTypeScriptAstSource(ast);
	}
}

export class ServerModuleGenerator extends Generator {
	getRequiredOptionNames(): string[] {
		return ['module'];
	}
	getRequiredConfigNames(): string[] {
		return ['serverModulePath', 'moduleSpecPath'];
	}
	getNames(): string[] {
		return ['server-module-generator', 'smo'];
	}
	async generate(): Promise<void> {
		const serverManagerGenerator = new ServerManagerGenerator(this.config);
		const serverControllerGenerator = new ServerControllerGenerator(this.config);
		const fullDirPath = this.getModuleDirPath();

		await FileSystem.ensureDir(fullDirPath);

		serverManagerGenerator.setOption({
			modulePath: this.option.modulePath || '',
			module: this.option.module,
			name: this.option.module,
		});

		serverControllerGenerator.setOption({
			modulePath: this.option.modulePath || '',
			module: this.option.module,
			name: this.option.module,
		});

		await FileSystem.writeFile(this.getIndexFilePath(), this.generatorIndexFileSource());
		await serverManagerGenerator.generate();
		await serverControllerGenerator.generate();
	}

	private getModuleDirPath(): string {
		return this.getFullPathFromSource(Path.join(this.config.serverModulePath, this.option.modulePath || '', this.getModuleName()));
	}
	private getIndexFilePath(): string {
		return Path.join(this.getModuleDirPath(), 'module-export.ts');
	}
	private getModuleName(): string {
		return `${this.option.module}-module`;
	}

	private generatorIndexFileSource(): string {
		const ast = parseTypescriptToAst(TEMPLATE);
		const builders = Recast.types.builders;

		ast.program.body[0].source.value = this.getImportPath(
			this.getIndexFilePath(),
			this.getFullPathFromSource(this.config.moduleSpecPath),
		);
		const specifier = ast.program.body[0].specifiers[0];
		specifier.imported = specifier.local = builders.identifier('createServerSideModule');

		ast.program.body[1].declaration.declarations[0].id = getCamelCaseName(this.getModuleName());
		ast.program.body[1].declaration.declarations[0].init.callee = builders.identifier('createServerSideModule');

		return printTypeScriptAstSource(ast);
	}
}
