import { loadConfig } from "./config-loader";

import { GeneratorInstanceProvider } from "./generator/spec";
import { Generators } from "./generator";
import { Command } from "commander";

const program = new Command();
program.name("uni");

async function bootstrap() {
    const config = await loadConfig();
    const provider = new GeneratorInstanceProvider(config.codegen);
    provider.add(...Generators);

    program.option('-g, --generator <name>', 'work as code generator mode');
    program.option('-s, --source <name>', 'provide source path to code generator');
    program.option('-n, --name <name>', 'provide class/function name to code generator');
    program.option('-p, --property <name>', 'provide properties to code generator');
    program.option('-x, --extends <name>', 'provide name that want to extends to code generator');
    program.option('-e, --event <name>', 'provide event name to code generator');
    program.option('-p, --module-path <name>', 'provider module path to code generator');
    program.option('-m, --module <name>', 'provider module name to code generator');

    program.addHelpText("afterAll", BuildGeneratorsHelpText(provider));

    program.parse();

    const options = program.opts();
    if (options.generator) {
        RunGenerator(provider, options)
    }

    if (Object.keys(options).length === 0) {
        program.outputHelp()
    }
}

function BuildGeneratorsHelpText(provider: GeneratorInstanceProvider) {
    let texts = [];
    for (const impl of provider.getAllImpls()) {
        const names = provider.getGenerator(impl).getNames();
        texts.push(` ${impl.name}: ${names.join(", ")}`);
    }


    texts.unshift("==========ALL GENERATORS START=========")
    texts.unshift("");

    texts.push("==========ALL GENERATORS END===========")
    texts.push("");

    return texts.map((text) => ('   ' + text)).join("\r\n");
}

function RunGenerator(provider: GeneratorInstanceProvider, options: any = {}) {
    const generator = provider.getGeneratorByName(options.generator);
    if (!generator)
        throw new Error(`please provide a generator that exists`)

    generator.setOption(options);
    generator.generate();
}

bootstrap();