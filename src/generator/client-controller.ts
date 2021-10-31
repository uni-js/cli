import { parseTypescriptToAst, printTypeScriptAstSource } from "../recast";
import { CodeGenerator, FileGenerator } from "./spec";
import * as Recast from "recast";
import Path from "path";

const TEMPLATE =
  `
import * as Events from '{CLIENT_INTERNAL_MODULE_PATH}';
import * as ExternalEvents from '{CLIENT_EXTERNAL_MODULE_PATH}';

import * as ServerEvents from '{SERVER_EXTERNAL_MODULE_PATH}';

import { inject, injectable } from 'inversify';
import { EventBusClient } from '{EVENT_BUS_CLIENT_SPEC_PATH}';
import { HandleExternalEvent } from '{EVENT_SPEC_PATH}';
import { ClientSideController } from '{CLIENT_SIDE_CONTROLLER_SPEC}';

@injectable()
export class NewClientController extends ClientSideController {
	constructor(
        @inject(EventBusClient) eventBus: EventBusClient,

    ){
        super(eventBus);

    }

    
}
`


export class ClientControllerGenerator extends FileGenerator {
  getNames(): string[] {
    return ["client-controller", "cc"];
  }

  getRequiredConfigNames(): string[] {
    return ["clientControllersPath", "clientControllerSpecPath", "clientInternalEventsModulePath", "clientExternalEventsModulePath", "serverExternalEventsModulePath", "eventsSpecPath", "eventBusClientSpecPath"];
  }

  getRequiredOptionNames(): string[] {
    return ["name"];
  }

  getTargetPath(): string {
    return Path.join(
      this.getFullPathFromSource(),
      this.config.clientControllersPath,
      `${this.getName()}.ts`
    );
  }

  private getName() {
    return `${this.option.name}-controller`;
  }

  generateSource(source?: string): string {
    if (!this.option.name)
      throw new Error(`must provide 'name' option to generate a client-side controller`);

    const ast = parseTypescriptToAst(TEMPLATE);

    ast.program.body[0].source.value = this.getImportPathToTarget(this.config.clientInternalEventsModulePath);

    ast.program.body[1].source.value = this.getImportPathToTarget(this.config.clientExternalEventsModulePath);

    ast.program.body[2].source.value = this.getImportPathToTarget(this.config.serverExternalEventsModulePath);

    ast.program.body[4].source.value = this.getImportPathToTarget(this.config.eventBusClientSpecPath);

    ast.program.body[5].source.value = this.getImportPathToTarget(this.config.eventsSpecPath);

    ast.program.body[6].source.value = this.getImportPathToTarget(this.config.clientControllerSpecPath);

    ast.program.body[7].declaration.id.name = this.getCamelCaseName(this.getName());

    return printTypeScriptAstSource(ast);
  }
}

export class AddClientExternalEventHandlerGenerator extends CodeGenerator {
  getRequiredConfigNames(): string[] {
    return ["clientControllersPath"]
  }
  getRequiredOptionNames(): string[] {
    return ["name", "event"];
  }
  getNames(): string[] {
    return ["client-external-event-handler", "ceeh"]
  }
  getTargetPath(): string {
    return Path.join(
      this.getFullPathFromSource(),
      this.config.clientControllersPath,
      `${this.getControllerName()}.ts`
    );
  }
  generateSource(source: string): string {
    const ast = parseTypescriptToAst(source);
    const line = ast.program.body.find((line: any) => {
      return line.type === "ExportNamedDeclaration" && line.declaration.type === "ClassDeclaration" && line.declaration.id?.name === this.getCamelCaseName(this.getControllerName());
    });

    if (!line)
      throw new Error(`couldn't find the target controller class declaration`);

    const classBody = line.declaration.body;

    const builders = Recast.types.builders;

    const methodKey = builders.identifier(`handle${this.getCamelCaseName(this.getEventName())}`);

    const methodEventParam = builders.identifier.from({
      name: "event",
      typeAnnotation: builders.tsTypeAnnotation(builders.tsTypeReference(builders.tsQualifiedName(builders.identifier("ServerEvents"), builders.identifier(this.getCamelCaseName(this.getEventName())))))
    });

    const methodParams = [methodEventParam];

    const decoratorParam = builders.memberExpression(builders.identifier("ServerEvents"), builders.identifier(this.getCamelCaseName(this.getEventName())));

    const decorator = builders.decorator(builders.callExpression(builders.identifier("HandleExternalEvent"), [decoratorParam]));

    classBody.body.push(builders.classMethod.from({
      kind: "method",
      accessibility: "private",
      key: methodKey,
      params: methodParams,
      body: builders.blockStatement([]),
      decorators: [decorator]
    }));

    return printTypeScriptAstSource(ast);
  }

  private getControllerName() {
    return `${this.option.name}-controller`;
  }
  private getEventName() {
    return `${this.option.event}-event`;
  }
}
