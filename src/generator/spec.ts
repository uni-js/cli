import { writeFile, stat, readFile } from "fs-extra";
import * as Path from "path";

export interface IGenerator{
    getRequiredOptionNames(): string[];
    getRequiredConfigNames(): string[];
    getNames(): string[];
    generate(): Promise<void>;
    setOption(option: any): void;
};

export abstract class Generator implements IGenerator{
    protected option: Record<string, any>;
    protected basicParams = ["sourcePath"];

    constructor(protected config: Record<string, any>){
        this.validateConfig();
    }

    private validateConfig(){
        for(const key of this.getRequiredConfigNames().concat(this.basicParams)){
            if(typeof(this.config[key]) !== "string")
                throw new Error(`config key: '${key}' must be provided to run the generator`);
        }
    }
    private validateOption(option: any){
        for(const key of this.getRequiredOptionNames()){
            if(option[key] === undefined)
                throw new Error(`option: '${key}' must be provided`);
        }
    }

    setOption(option: Record<string, any>){
        this.validateOption(option);
        this.option = option;
    }

    protected getFullPathFromSource(relPath: string = ""){
        return Path.resolve(this.config.sourcePath, relPath);
    }

    protected getImportPath(pathFrom:string, pathTo: string){
        const relPath = Path.relative(Path.dirname(pathFrom), pathTo);
        const parsed = Path.parse(relPath)
        const dir = parsed.dir === '' ? "." : parsed.dir;
        const result = dir + "/" + parsed.name;
        return result.split(Path.sep).join("/");
    }

    abstract generate(): Promise<void>;

    abstract getRequiredConfigNames(): string[];
    abstract getRequiredOptionNames(): string[];
    abstract getNames(): string[];

}

export abstract class FileGenerator extends Generator{
    async generate(): Promise<void>{
        return writeFile(this.getTargetPath(), this.generateSource());
    };

    protected getTargetDirPath(){
        return Path.dirname(this.getTargetPath());
    }

    protected getImportPathToTarget(relPath: string){
        return this.getImportPath(this.getTargetPath(), this.getFullPathFromSource(relPath))
    }

    abstract getTargetPath(): string;
    abstract generateSource(source?: string): string;
}

export abstract class CodeGenerator extends Generator{
    constructor(config: Record<string, any>){
        super(config);

        this.basicParams.push("source");
    }

    async generate(): Promise<void>{
        const sourceBuffer = await readFile(this.getTargetPath());
        return writeFile(this.getTargetPath(), this.generateSource(sourceBuffer.toString()));
    };

    protected getTargetDirPath(){
        return Path.dirname(this.getTargetPath());
    }
    
    protected getImportPathToTarget(relPath: string){
        return this.getImportPath(this.getTargetPath(), this.getFullPathFromSource(relPath))
    }

    getTargetPath(){
        return this.config.source;
    }

    abstract generateSource(source: string): string;
}

export type ConfigGeneratorImpl = { 
    new (config: any): IGenerator,
 };

export class GeneratorInstanceProvider{
    private generators = new Map<ConfigGeneratorImpl, IGenerator>();
    constructor(private config: any){
        if(!config){
            throw new Error(`codegen config must be provided`);
        }

    }
    private get generatorsArray(){
        return Array.from(this.generators.values());
    }

    add(...impls: ConfigGeneratorImpl[]){
        for(const impl of impls){
            this.generators.set(impl, new impl(this.config));
        }
    }

    getAllImpls(): ConfigGeneratorImpl[]{
        return Array.from(this.generators.keys());
    }

    getGeneratorByName(name: string){
        return this.generatorsArray.find((generator)=>{
            return generator.getNames().indexOf(name) !== -1;
        })
    }

    getGenerator(impl: ConfigGeneratorImpl){
        return this.generators.get(impl);
    }
    
}