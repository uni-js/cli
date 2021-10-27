import * as Recast from "recast";
import * as TypeScriptParser from "recast/parsers/typescript";

export function parseTypescriptToAst(source: string){
    return Recast.parse(source,{parser:TypeScriptParser});
}

export function printTypeScriptAstSource(ast: any){
    return Recast.print(ast,{parser:TypeScriptParser}).code;
}