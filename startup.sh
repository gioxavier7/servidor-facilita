#!/bin/bash
cd /home/site/wwwroot

echo "=== DEPLOY AZURE - VERSÃO SIMPLIFICADA ==="
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# Ignorar o node_modules.tar.gz do Azure e forçar instalação limpa
echo "1. Limpando instalação anterior..."
rm -rf node_modules
rm -f package-lock.json

echo "2. Instalando dependências (incluindo dev)..."
npm install --production=false --verbose

echo "3. Gerando Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "4. Verificação final..."
if [ -f "node_modules/.prisma/client/index.js" ]; then
    echo "✅ PRISMA CLIENT GERADO COM SUCESSO!"
else
    echo "❌ FALHA: Prisma Client não encontrado"
    find node_modules -name "*prisma*" -type d | head -10
    exit 1
fi

echo "5. Iniciando aplicação..."
node app.js