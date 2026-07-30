# FeiraVerde Digital

Protótipo de gestão do programa municipal **Feira Verde**: troca de materiais
recicláveis por hortifrúti em pontos móveis de bairro, com controle de rotas,
estoque por lote e canal direto com os produtores da agricultura familiar.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes da camada de domínio
npm run build
```

## Perfis

| Perfil | O que faz |
| --- | --- |
| **Gestão & Estoque** | KPIs, status das rotas, estoque por lote, carregamento dos caminhões, taxas de conversão |
| **PDV Troca** | Terminal do operador no caminhão: pesagem de recicláveis, retirada de alimentos, recibo |
| **Cidadão** | Saldo, calculadora de troca, itinerário dos caminhões, histórico |
| **Produtores & Alertas** | Pedidos urgentes da prefeitura e registro de entregas |

## Arquitetura

```
src/
  estado.js        # domínio + persistência — sem dependência de React
  useAppState.js   # ponte com o React (subscribe/re-render)
  utilitarios.js   # formatação e toasts
  App.jsx          # shell e navegação entre perfis
  components/      # uma tela por perfil + modais
testes/
  dominio.test.mjs # regras de negócio, em Node puro
```

### Decisões do modelo

**Lote é entidade de primeira classe.** Estoque não é um número que sobe e
desce: é a soma dos saldos dos lotes. Cada entrada cria um lote novo com seu
fornecedor e sua validade — o histórico nunca é sobrescrito.

**Saída por validade (FEFO).** Perecível não sai por ordem de chegada, sai por
ordem de vencimento. É o que dá sentido ao rótulo "antidesperdício".

**Unidades são explícitas.** Plástico em kg, óleo em litros, pneu em unidades.
A taxa de conversão de cada material é expressa na unidade dele. Não existe
nenhum total que some grandezas diferentes.

**Todo saldo vem de um movimento.** `ENTRADA`, `CARREGAMENTO`, `TROCA`,
`RETORNO` e `PERDA` são registros imutáveis. O saldo é consequência do
histórico — um programa público precisa ser auditável.

**Operações são atômicas.** Uma troca valida saldo do munícipe e carga do
caminhão *antes* de escrever qualquer coisa. Falhou num item, nada é gravado.

**Componentes não mutam estado.** Toda alteração passa por um método de
`appState`, que devolve `{ ok, erro }`.

## Limitações conhecidas

Isto ainda é um protótipo de fluxo, não um sistema em produção:

- **Sem backend.** Os dados vivem no `localStorage` do navegador. O tablet do
  caminhão e o painel da prefeitura não compartilham estado — é a próxima
  peça a construir.
- **Sem autenticação.** O seletor de munícipe e a troca de perfil simulam
  login. A menção ao Gov.br é ilustrativa.
- **CPF é dado pessoal.** Hoje fica em claro no navegador (mascarado apenas na
  exibição). Antes de qualquer piloto com dados reais, isso precisa sair do
  cliente e passar por uma avaliação de LGPD.
- Sem migração de schema: mudou `VERSAO_SCHEMA`, o banco local é recriado.
