import { parseTypescriptToAst, printTypeScriptAstSource } from "../recast";
import { FileGenerator } from "./spec";
import Path from "path";

const TEMPLATE =
    `
import { inject, injectable } from 'inversify';
import { ServerSideManager } from '{SERVER_MANAGER_DEFINE_PATH}';

import * as Events from '{INTERNAL_EVENT_MODULE_PATH}';

@injectable()
export class NewServerSideManager extends ServerSideManager {
    constructor(){
        super();

    }

}
`

export class ServerManagerGenerator extends FileGenerator {
    getNames(): string[] {
        return ["server-manager", "sm"];
    }

    getRequiredConfigNames(): string[] {
        return ["serverModulePath", "serverManagerSpecPath", "serverInternalEventsModulePath"];
    }

    getRequiredOptionNames(): string[] {
        return ["name", "module"];
    }

    getTargetPath(): string {
        return Path.join(
            this.getFullPathFromSource(),
            this.config.serverModulePath,
            this.option.module || "",
            `${this.getName()}.ts`
        );
    }

    private getName() {
        return `${this.option.name}-manager`;
    }

    generateSource(source?: string): string {
        if (!this.option.name)
            throw new Error(`must provide 'name' option to generate a server manager`);

        const ast = parseTypescriptToAst(TEMPLATE);

        ast.program.body[1].source.value = this.getImportPathToTarget(this.config.serverManagerSpecPath);

        ast.program.body[2].source.value = this.getImportPathToTarget(this.config.serverInternalEventsModulePath);

        ast.program.body[3].declaration.id.name = this.getCamelCaseName(this.getName());

        return printTypeScriptAstSource(ast);
    }

}