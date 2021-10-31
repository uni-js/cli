import { parseTypescriptToAst, printTypeScriptAstSource } from "../recast";
import { FileGenerator } from "./spec";
import Path from "path";

const TEMPLATE =
    `
import { inject, injectable } from 'inversify';
import { ClientSideManager } from '{CLIENT_MANAGER_DEFINE_PATH}';

import * as Events from '{INTERNAL_EVENT_MODULE_PATH}';

@injectable()
export class NewGameManager extends ClientSideManager {
    constructor(){
        super();

    }

}
`

export class ClientManagerGenerator extends FileGenerator {
    getNames(): string[] {
        return ["client-manager", "cm"];
    }

    getRequiredConfigNames(): string[] {
        return ["clientManagersPath", "clientManagerSpecPath", "clientInternalEventsModulePath"];
    }

    getRequiredOptionNames(): string[] {
        return ["name"];
    }

    getTargetPath(): string {
        return Path.join(
            this.getFullPathFromSource(),
            this.config.clientManagersPath,
            `${this.getName()}.ts`
        );
    }

    private getName() {
        return `${this.option.name}-manager`;
    }

    generateSource(): string {
        if (!this.option.name)
            throw new Error(`must provide 'name' option to generate a client manager`);

        const ast = parseTypescriptToAst(TEMPLATE);

        ast.program.body[1].source.value = this.getImportPathToTarget(this.config.clientManagerSpecPath);

        ast.program.body[2].source.value = this.getImportPathToTarget(this.config.clientInternalEventsModulePath);

        ast.program.body[3].declaration.id.name = this.getCamelCaseName(this.getName());

        return printTypeScriptAstSource(ast);
    }

}
