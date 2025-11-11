#!/bin/bash
cd /home/site/wwwroot

echo "=== INICIANDO DEPLOY NO AZURE ==="
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "Instalando dependências..."
npm install

echo "Gerando cliente Prisma..."
npx prisma generate

echo "Verificando se o Prisma foi gerado..."
if [ -d "node_modules/.prisma" ]; then
    echo "✅ Prisma Client gerado com sucesso!"
else
    echo "❌ ERRO: Prisma Client não foi gerado"
    exit 1
fi

echo "Iniciando aplicação..."
node app.js