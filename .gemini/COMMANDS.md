# Comandos Úteis do Projeto

## Desenvolvimento
- Iniciar o servidor local:
  `npm run dev`

## Banco de Dados (Prisma)
- Atualizar a tipagem do Prisma Client no código após mudar o schema:
  `npx prisma generate`
- Enviar as alterações do `schema.prisma` diretamente para o banco de dados (sem criar arquivo de migração - ideal para fase inicial):
  `npx prisma db push`
- Abrir a interface visual do banco de dados no navegador:
  `npx prisma studio`

## Git e Versionamento
- Fluxo padrão de salvamento e envio para branch específica:
  `git add .`
  `git commit -m "tipo: mensagem curta do que foi feito"`
  `git push -u origin nome-da-branch`
- Forçar atualização de histórico no repositório remoto (Cuidado):
  `git push -u origin main -f`

## Tratamento de Erros Comuns Vercel / Prisma
Se houver erro de build na Vercel relacionado ao Prisma não encontrado, garantir que o comando abaixo rode após as instalações:
- `prisma generate` (Configurado no `postinstall` do `package.json`)
