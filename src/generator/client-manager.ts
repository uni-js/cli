import { parseTypescriptToAst, printTypeScriptAstSource } from "../recast";
import { FileGenerator } from "./spec";
import Path from "path";

const TEMPLATE = 
`
import { inject, injectable } from 'inversify';
import { GameManager } from '{CLIENT_MANAGER_DEFINE_PATH}';

import * as Events from '{INTERNAL_EVENT_MODULE_PATH}';

@injectable()
export class NewGameManager extends GameManager {
    constructor(){
        super();

    }

}
`

export class ClientManagerGenerator extends FileGenerator{
    getNames(): string[] {
        return ["cm", "client-manager"];
    }

    getRequiredConfigNames(): string[] {
        return ["managersPath", "clientManagerImportPath", "internalEventsModulePath"];
    }

    getRequiredOptionNames(): string[]{
        return ["name"];
    }

    getTargetPath(): string{
        return Path.join(
            this.getFullPathFromSource(), 
            this.config.managersPath,
            `${this.getName()}.ts`
        );
    }

    private getName(){
        return `${this.option.name}-manager`;
    }

    generateSource(): string {
        if(!this.option.name)
            throw new Error(`must provide 'name' option to generate a client manager`);

        const ast = parseTypescriptToAst(TEMPLATE);

        const managerPathLine = ast.program.body[1];
        managerPathLine.source.value = this.getImportPath(this.getTargetPath(),this.getFullPathFromSource(this.config.clientManagerImportPath));
        
        const eventsModuleLine = ast.program.body[2];
        eventsModuleLine.source.value = this.getImportPath(this.getTargetPath(),this.getFullPathFromSource(this.config.internalEventsModulePath));

        ast.program.body[3].declaration.id.name = this.getCamelCaseName(this.getName());

        return printTypeScriptAstSource(ast);
    }

}
