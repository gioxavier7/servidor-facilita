#!/bin/bash
cd /home/site/wwwroot

echo "=== INICIANDO DEPLOY NO AZURE ==="
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "1. Instalando dependências..."
npm install

echo "2. Gerando cliente Prisma..."
npx prisma generate

echo "3. Verificando se o Prisma foi gerado..."
if [ -d "node_modules/.prisma" ] || [ -d "node_modules/@prisma" ]; then
    echo "✅ Prisma Client gerado com sucesso!"
else
    echo "❌ ERRO: Prisma Client não foi gerado"
    echo "Listando node_modules:"
    ls -la node_modules/ | grep prisma
    exit 1
fi

echo "4. Iniciando aplicação..."
node app.js