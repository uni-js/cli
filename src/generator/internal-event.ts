import * as Recast from "recast";
import { parseTypescriptToAst, printTypeScriptAstSource } from "../recast";
import { Generator } from "./spec";
import * as Path from "path";
import { readFile, pathExists, writeFile } from "fs-extra"

export const INTERNAL_EVENT = "InternalEvent";
export const EXTERNAL_EVENT = "ExternalEvent";
export const DEFAULT_EXPORT_INDEX_FILE = `export {}`;

export abstract class EventGenerator extends Generator{
    getRequiredOptionNames(): string[] {
        return ["name", "property"];
    }
    private async addIndexExport(eventName: string, importPath: string){
        const path = this.getIndexPath();
        const exists = await pathExists(path);
        if(!exists){
            await writeFile(path, DEFAULT_EXPORT_INDEX_FILE)
        }

        const buffer = await readFile(path);
        const source = buffer.toString();
        const ast = parseTypescriptToAst(source);
        const body = ast.program.body;
        const builders = Recast.types.builders;
        for(const line of body){
            if(line.type === "ImportDeclaration" && line.specifiers[0]?.imported?.name === this.getEventName()){
                return;
            }

        };

        const lastLine = body[body.length - 1];
        lastLine.specifiers.push(builders.exportSpecifier.from({local:builders.identifier(eventName),exported:builders.identifier(eventName)}))

        body.unshift(builders.importDeclaration([builders.importSpecifier(builders.identifier(eventName))],builders.stringLiteral(importPath)))

        await writeFile(path, printTypeScriptAstSource(ast));
        
    }
    protected getEventName(){
        const eventName = this.getCamelCaseName(this.option.name);
        return eventName;
    }
    
    protected getSpecPath(){
        return this.getFullPathFromSource(this.config.eventsSpecPath)
    }

    private parsePropertyMap(sourceText: string) {
        const builders = Recast.types.builders;
        const parts = sourceText.split(",");
        const properties: Recast.types.namedTypes.ClassProperty[] = [];
        
        for(const part of parts){
            const [propertyName, typeName] = part.split(":");
            
            properties.push(builders.classProperty(
                builders.identifier(this.getCamelCaseName(propertyName, true)),null,
                builders.tsTypeAnnotation(this.parseTypeNameToAnnotation(typeName))
            ));
        }

        return properties;
    }
    private parseTypeNameToAnnotation(typeName: string = "string") {
        const builders = Recast.types.builders;
        if(typeName === "string")
            return builders.tsStringKeyword();
        else if(typeName === "boolean")
            return builders.tsBooleanKeyword();
        else if(typeName === "number")
            return builders.tsNumberKeyword();
        else{
            throw new Error(`not a valid type name: ${typeName}`);
        }
        
    }

    generateSource(): string {

        const ast = parseTypescriptToAst('');
        const builders = Recast.types.builders;

        const specifier = builders.importSpecifier(builders.identifier(this.getSpecImportedKey()),builders.identifier(this.getSpecImportedKey()));
        const importPathLiteral = builders.stringLiteral(this.getImportPath(this.getTargetPath(),this.getSpecPath()));
        ast.program.body.push(builders.importDeclaration([specifier],importPathLiteral));

        ast.program.body.push(builders.exportNamedDeclaration(
            builders.classDeclaration(builders.identifier(this.getEventName()),builders.classBody(
                this.parsePropertyMap(this.option.property)
            ), builders.identifier(this.getSpecImportedKey()))
        ));

        return printTypeScriptAstSource(ast);
    }
    async generate(): Promise<void> {
        const importPath = this.getImportPath(this.getIndexPath(), this.getTargetPath())
        await this.addIndexExport(this.getEventName(), importPath);

        return writeFile(this.getTargetPath(), this.generateSource());
    }

    abstract getIndexPath() : string;
    abstract getSpecImportedKey() : string;
        
}

export class ClientInternalEventGenerator extends EventGenerator {
    getRequiredConfigNames(): string[] {
        return ["clientInternalEventsModulePath","eventsSpecPath"];
    }
    getNames(): string[] {
        return ["client-internal-event", "cie"]
    }
    getTargetPath() {
        return Path.resolve(this.getFullPathFromSource(), this.config.clientInternalEventsModulePath,`${this.option.name}.ts`);   
    }
    getIndexPath(){
        const indexPath = Path.resolve(this.getFullPathFromSource(), this.config.clientInternalEventsModulePath,'index.ts');
        return indexPath;
    }
    getSpecImportedKey(){
        return INTERNAL_EVENT;
    }

 
}

export class ServerInternalEventGenerator extends EventGenerator {
    getRequiredConfigNames(): string[] {
        return ["serverInternalEventsModulePath","eventsSpecPath"];
    }
    getNames(): string[] {
        return ["server-internal-event", "sie"]
    }
    getTargetPath() {
        return Path.resolve(this.getFullPathFromSource(), this.config.serverInternalEventsModulePath,`${this.option.name}.ts`);   
    }
    getIndexPath(){
        const indexPath = Path.resolve(this.getFullPathFromSource(), this.config.clientInternalEventsModulePath,'index.ts');
        return indexPath;
    }
    getSpecImportedKey(){
        return INTERNAL_EVENT;
    }

}

export class ClientExternalEventGenerator extends EventGenerator{
    getRequiredOptionNames(): string[] {
        return [];
    }
    getRequiredConfigNames(): string[] {
        return [
            "eventsSpecPath",
            "clientExternalEventsModulePath",
            "clientInternalEventsModulePath",
        ];
    }
    getNames(): string[] {
        return ["client-external-event", "cee"]
    }
    getTargetPath() {
        return Path.resolve(this.getFullPathFromSource(), this.config.clientExternalEventsModulePath,`${this.option.name || this.option.extends}.ts`);   
    }
    getIndexPath(){
        const indexPath = Path.resolve(this.getFullPathFromSource(), this.config.clientExternalEventsModulePath,'index.ts');
        return indexPath;
    }
    getSpecImportedKey(){
        return EXTERNAL_EVENT;
    }

    protected getEventName(){
        return this.getCamelCaseName(this.option.name || this.option.extends);
    }

    generateSource(): string {
        if(this.option.extends){
            const extending = this.getCamelCaseName(this.option.extends);

            const ast = parseTypescriptToAst('');
            const builders = Recast.types.builders;
   
            const nameSpaceSpecifier = builders.importNamespaceSpecifier(builders.identifier("InternalEvents"));
            const internalPathLiteral = builders.stringLiteral(this.getImportPath(this.getTargetPath(),this.getFullPathFromSource(this.config.clientInternalEventsModulePath)));
            ast.program.body.push(builders.importDeclaration([nameSpaceSpecifier],internalPathLiteral));
            ast.program.body.push(
                builders.exportNamedDeclaration(
                    builders.classDeclaration(
                        builders.identifier(this.getEventName()), 
                        builders.classBody([]), 
                        builders.memberExpression(builders.identifier("InternalEvents"), builders.identifier(extending))
                    )
                ));

            return printTypeScriptAstSource(ast);
        }else{
            return super.generateSource.call(this);
        }

    }

}
