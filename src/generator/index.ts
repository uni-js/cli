import { ClientManagerGenerator } from "./client-manager";
import { 
    ClientInternalEventGenerator, 
    ServerInternalEventGenerator,
    ClientExternalEventGenerator
} from "./internal-event";
import { ConfigGeneratorImpl } from "./spec";

export const Generators : ConfigGeneratorImpl[] = [ 
    ClientManagerGenerator, 
    ClientInternalEventGenerator, 
    ServerInternalEventGenerator,
    ClientExternalEventGenerator
];
