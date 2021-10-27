import { ClientManagerGenerator } from "./client-manager";
import { AddInternalEventGenerator } from "./internal-event";
import { ConfigGeneratorImpl } from "./spec";

export const Generators : ConfigGeneratorImpl[] = [ ClientManagerGenerator, AddInternalEventGenerator ];
