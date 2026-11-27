/** Mock para os testes (Vitest, Node): mesmos handlers do navegador. */
import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const servidorMock = setupServer(...handlers);
