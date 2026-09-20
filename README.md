# ROVIX CONSTRUMAX V1 — Standalone

Sistema independente para gestão de lojas de materiais de construção.

## Regra de arquitetura
Este projeto não depende de nenhum ERP/POS externo. Banco, autenticação, APIs, telas e regras transacionais pertencem ao próprio CONSTRUMAX.

## Módulos V1
- Login e perfis: ADMIN, MANAGER, CASHIER, STOCK, VIEWER
- Dashboard
- Produtos com SKU, código de barras, unidade, NCM/CEST, custo, preço e estoque mínimo
- Clientes e limite de crédito
- Fornecedores
- Depósitos
- Estoque por depósito e movimentações
- Compras/recebimento com entrada automática no estoque
- PDV/vendas com validação e baixa de estoque
- Crediário / contas a receber
- Contas a pagar geradas por compras
- Entregas
- Auditoria

## Unidades recomendadas
UN, KG, M, M2, M3, SACO, CAIXA, BARRA, ROLO, TON.
As quantidades usam NUMERIC(14,3), permitindo venda fracionada.

## Instalação rápida
1. Instale Node.js 24+ e Docker Desktop.
2. Copie `.env.example` para `.env.local`.
3. Gere uma chave forte para `JWT_SECRET`.
4. Execute:

```powershell
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse `http://localhost:3000`.

Usuário inicial de desenvolvimento:
- e-mail: `admin@rovix.local`
- senha: `Rovix@123`

**Troque a senha antes de qualquer uso real.**

## Fluxos transacionais
### Compra
Compra RECEIVED -> itens -> saldo de estoque + -> movimento PURCHASE -> atualização de custo -> conta a pagar opcional -> auditoria.

### Venda
Venda -> lock do saldo -> validação de estoque -> itens -> saldo - -> movimento SALE -> crediário opcional -> entrega opcional -> auditoria.

## Fiscal
A V1 standalone não acopla biblioteca fiscal de terceiros. O diretório `src/server/fiscal` será implementado como módulo próprio/adapter independente para NF-e/NFC-e. Até homologação SEFAZ, não use esta V1 para emissão fiscal em produção.

## Próximas versões
- Carrinho PDV multi-item visual
- Orçamento -> pedido -> venda
- Parcelamento de crediário
- Baixa de contas e caixa
- Importação XML de NF-e
- Inventário e transferência entre depósitos
- Fiscal NF-e/NFC-e
- Relatórios e DRE simplificada
- Multiempresa/SaaS
