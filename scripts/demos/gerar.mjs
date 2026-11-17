// Gera as demos estáticas que vêm de projetos com templates EJS.
// Uso: npm install && node gerar.mjs [pasta-com-os-clones]
import { gerar as portalEscolar } from './portal-escolar.mjs';
import { gerar as ceilandiaTimes } from './ceilandia-times.mjs';

await portalEscolar();
await ceilandiaTimes();
