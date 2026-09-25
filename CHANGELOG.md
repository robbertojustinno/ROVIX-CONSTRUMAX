# Changelog

## 1.2.2 - 2026-09-25
- Instalador comercial Windows em formato EXE.
- Instala aplicação e runtimes privados em Program Files.
- Dados, banco, configurações e logs ficam separados em C:\ProgramData\ROVIX\CONSTRUMAX.
- Cria atalhos no Desktop e Menu Iniciar.
- Primeiro uso cria banco, migrations e administrador automaticamente.
- Desinstalador preserva os dados do cliente por segurança.
- Novo comando npm run build:installer.
- Geração do instalador com Inno Setup 6.

## 1.2.1 - 2026-09-20
- Edição Portable para Windows sem instalação de Node.js, npm, Docker ou PostgreSQL no cliente.
- Build standalone do Next.js.
- PostgreSQL privado executado dentro da própria pasta do CONSTRUMAX.
- Inicialização com duplo clique em INICIAR_CONSTRUMAX.bat.
- Primeiro início cria banco, migrations, administrador, depósito e credenciais automaticamente.
- Portas locais livres são escolhidas automaticamente.
- Senhas internas e JWT são gerados automaticamente.
- Navegador abre o CONSTRUMAX automaticamente.
- PARAR_CONSTRUMAX.bat encerra aplicação e PostgreSQL.
- BUILD_PORTABLE.ps1 fabrica o ZIP final usando os runtimes instalados somente na máquina de desenvolvimento.

## 1.2.0 - 2026-09-20
- Novo menu Administrativo, visível para ADMIN.
- Configuração do nome da empresa e logo personalizada.
- Logo personalizada passa a aparecer no menu e nos orçamentos impressos.
- Cadastro administrativo de Categorias, Marcas e Unidades.
- Tela de Produtos passa a usar listas administradas para categoria, marca e unidade.
- Campos de Produto ganham rótulos e explicações de SKU, NCM, CEST, custo, preço e estoque mínimo.
- Produtos podem ser editados, inativados e reativados.
- Nova migration 003_admin_catalog.sql.

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
