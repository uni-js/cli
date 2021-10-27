import { loadConfig } from "./config-loader";

import { GeneratorInstanceProvider } from "./generator/spec";
import { Generators } from "./generator";
import { Command } from "commander";

const program = new Command();
program.name("uni");

async function bootstrap(){
    const config = await loadConfig();
    const provider = new GeneratorInstanceProvider(config.codegen);
    provider.add(...Generators);

    program.requiredOption('-g, --generator <name>','work as code generator mode');
    program.option('-s, --source <name>','provide source path to code generator');
    program.option('-n, --name <name>','provide class/function name to code generator');
    program.option('-p, --property <name>','provide properties to code generator');
    
    program.parse();

    const options = program.opts();
    if(options.generator){
        runGenerator(provider, options)
    }

}

function runGenerator(provider:GeneratorInstanceProvider, options: any = {}){
    const generator = provider.getGeneratorByName(options.generator);
    if(!generator)
        throw new Error(`provide a generator that exists: ${provider.getAllNames().join(", ")}`)

    generator.setOption(options);
    generator.generate();
}

bootstrap();