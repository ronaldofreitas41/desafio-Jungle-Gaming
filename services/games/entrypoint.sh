#!/bin/sh

#Arquivo criado para executar os scripts do prisma e iniciar o serviço junto a inicialização do docker compose

set -e

echo "Executando Prisma migrate deploy..."
bun prisma migrate deploy

echo "Iniciando Games Service..."
exec bun run src/main.ts
