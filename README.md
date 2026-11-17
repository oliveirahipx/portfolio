# portfolio

Código do meu portfólio, publicado em **[miguel.hipfinance.com.br](https://miguel.hipfinance.com.br)**.

É um site estático em HTML, CSS e JavaScript, sem framework. Cada projeto aparece como uma tabela, e o diagrama do topo liga as tecnologias aos projetos que as usam: clicar numa tecnologia filtra a lista.

## Demos

Cada projeto tem uma demonstração em `site/demos/<projeto>/` que dá para usar no navegador:

| Demo | Como funciona |
|---|---|
| `riscv` | Interpretador RV32IM que roda o programa do trabalho instrução por instrução. Confere com o trace do RARS nos 107 passos. |
| `api-monitor` | Front original do projeto; os testes de URL passam por uma Pages Function (`functions/api/monitor/testar.js`) que faz o GET de verdade e recusa endereços internos. |
| `arraia-show-api` | Explorador da API com um backend simulado no navegador que segue os controllers reais (JWT HS256 de verdade via Web Crypto). |
| `portal-escolar`, `ceilandia-times` | Templates EJS reais renderizados com dados fictícios por `scripts/demos/gerar.mjs`. |
| `agenda-pessoal`, `portal-libras` | O código do próprio projeto, copiado por `scripts/montar_demos.py`. Na cópia do Libras a marca da universidade é trocada por um texto neutro. |
| `fastfood-manager`, `embaixada-desktop` | Capturas reais dos programas Swing e o `.jar` para baixar. |
| `hipfinance` | Build web da versão de demonstração do app (dados fictícios). O build não fica neste repositório porque o código do app é privado. |

## Rodar localmente

```sh
npx wrangler pages dev site
```

Sem a Pages Function, `python -m http.server -d site` também serve tudo, menos o teste de URL do api-monitor.

## Regenerar as demos

```sh
python scripts/montar_demos.py ..          # agenda-pessoal e portal-libras
cd scripts/demos && npm install && node gerar.mjs ../../..   # portal-escolar e ceilandia-times
```

Os dois scripts esperam os repositórios dos projetos clonados ao lado deste.

## Deploy

```sh
npx wrangler pages deploy site --project-name miguel-portfolio --branch main
```
