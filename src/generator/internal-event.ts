import * as Recast from "recast";
import { parseTypescriptToAst, printTypeScriptAstSource } from "../recast";
import { Generator } from "./spec";
import * as Path from "path";
import { readFile, pathExists, writeFile } from "fs-extra"

export const INTERNAL_EVENT = "InternalEvent";
export const DEFAULT_EXPORT_INDEX_FILE = `export {}`;

export class AddInternalEventGenerator extends Generator{
    getRequiredConfigNames(): string[] {
        return ["internalEventsModulePath","internalEventsSpecPath"];
    }
    getRequiredOptionNames(): string[] {
        return ["name", "property"];
    }
    getNames(): string[] {
        return ["add-in-event"]
    }
    getTargetPath() {
       return Path.resolve(this.getFullPathFromSource(), this.config.internalEventsModulePath,`${this.option.name}.ts`);
        
    }
    private getIndexPath(){
        const indexPath = Path.resolve(this.getFullPathFromSource(), this.config.internalEventsModulePath,'index.ts');
        return indexPath;
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
    private getEventName(){
        const eventName = this.getCamelCaseName(this.option.name);
        return eventName;
    }
    private getSpecPath(){
        return this.getFullPathFromSource(this.config.internalEventsSpecPath)
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

        const specifier = builders.importSpecifier(builders.identifier(INTERNAL_EVENT),builders.identifier(INTERNAL_EVENT));
        const importPathLiteral = builders.stringLiteral(this.getImportPath(this.getTargetPath(),this.getSpecPath()));
        ast.program.body.push(builders.importDeclaration([specifier],importPathLiteral));

        ast.program.body.push(builders.exportNamedDeclaration(
            builders.classDeclaration(builders.identifier(this.getEventName()),builders.classBody(
                this.parsePropertyMap(this.option.property)
            ), builders.identifier(INTERNAL_EVENT))
        ));

        return printTypeScriptAstSource(ast);
    }
    async generate(): Promise<void> {
        const importPath = this.getImportPath(this.getIndexPath(), this.getTargetPath())
        await this.addIndexExport(this.getEventName(), importPath);

        return writeFile(this.getTargetPath(), this.generateSource());
    }

}