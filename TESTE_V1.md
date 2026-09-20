# Checklist de teste — ROVIX CONSTRUMAX V1

1. Subir PostgreSQL com `docker compose up -d`.
2. Executar migration e seed.
3. Login como administrador.
4. Cadastrar fornecedor e cliente.
5. Confirmar depósito DP01.
6. Cadastrar produto com unidade fracionável.
7. Receber uma compra e validar aumento do saldo.
8. Fazer venda menor que o saldo e validar baixa.
9. Tentar vender acima do saldo: deve falhar sem gravar venda parcial.
10. Fazer venda CREDIT com cliente: deve gerar contas a receber.
11. Fazer compra com due_date: deve gerar contas a pagar.
12. Fazer venda com endereço de entrega: deve gerar entrega PENDING.
13. Fazer ajuste de estoque e conferir movimento.
14. Conferir dashboard e auditoria no banco.
15. Validar que não há emissão fiscal habilitada antes da homologação.
