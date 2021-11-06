import { ClientManagerGenerator } from "./client-manager";
import { ServerManagerGenerator } from "./server-manager";
import { 
    ClientInternalEventGenerator, 
    ServerInternalEventGenerator,
    ClientExternalEventGenerator,
    ServerExternalEventGenerator
} from "./event";
import { ClientControllerGenerator, AddClientExternalEventHandlerGenerator } from "./client-controller";
import { ServerControllerGenerator, AddServerExternalEventHandlerGenerator } from "./server-controller";

import { ConfigGeneratorImpl } from "./spec";
import { ClientModuleGenerator } from "./module";

export const Generators : ConfigGeneratorImpl[] = [ 
    ClientManagerGenerator, 
    ServerManagerGenerator,
    ClientInternalEventGenerator, 
    ServerInternalEventGenerator,
    ClientExternalEventGenerator,
    ServerExternalEventGenerator,
    ClientControllerGenerator,
    ServerControllerGenerator,
    AddClientExternalEventHandlerGenerator,
    AddServerExternalEventHandlerGenerator,
    ClientModuleGenerator
];
