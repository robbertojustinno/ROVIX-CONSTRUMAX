# Changelog

## 1.1.3 - 2026-09-20
- Orçamentos abertos podem ser editados após o salvamento.
- Edição permite alterar cliente, itens, quantidade, preço, desconto, validade e observações.
- Itens podem ser adicionados ou removidos durante a edição.
- Orçamentos convertidos permanecem bloqueados para edição, preservando histórico.
- Botão Imprimir disponível para orçamentos abertos e convertidos.
- Página própria de impressão em formato A4, com cliente, itens, totais, vendedor e validade.
- Impressão pode ser enviada à impressora ou salva como PDF pelo navegador.

## 1.1.2 - 2026-09-20
- Ajuste de estoque passa a trabalhar com novo saldo físico, não alteração direta.
- Motivo do ajuste é obrigatório.
- Diferença entre saldo antigo e novo é calculada automaticamente.
- Ajustes geram movimentação de estoque e auditoria com usuário e data.
- Tela de estoque passa a ter ações Ajustar, Histórico e Transferir.
- Histórico por produto/depósito mostra movimentações, motivo e usuário.

## 1.1.1 - 2026-09-20
- Orçamentos abertos podem ser excluídos com confirmação.
- Conversão de orçamento redireciona para a venda gerada.
- Orçamentos convertidos exibem botão para abrir a venda.
- Tela de detalhe da venda com itens, depósito, valores e vendedor.
- Compras usam listas de fornecedor, depósito e produto em vez de IDs digitados.
- Ajustes de estoque usam listas de produto e depósito.
- Entregas usam listas de venda e cliente.
- Vendas passam a exibir botão Abrir.

## 1.1.0 - 2026-09-20
- PDV com carrinho multi-item.
- Busca de produtos por nome, SKU e código de barras.
- Orçamentos com conversão em venda.
- Crediário parcelado.
- Baixa de contas a receber e pagar.
- Transferência entre depósitos com movimentação dupla de estoque.
- Migration incremental 002_v1_1.sql.

## 1.0.0 - 2026-09-20
- Primeira base standalone do ROVIX CONSTRUMAX.
- Banco, autenticação, estoque, compras, vendas, financeiro, entregas e auditoria próprios.
