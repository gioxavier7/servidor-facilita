#!/bin/bash
cd /home/site/wwwroot

echo "=== INICIANDO DEPLOY NO AZURE ==="
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# Forçar reinstalação para garantir que tudo está correto
echo "1. Removendo node_modules existente..."
rm -rf node_modules
rm -rf package-lock.json

echo "2. Instalando dependências..."
npm install --production=false

echo "3. Gerando cliente Prisma..."
npx prisma generate

echo "4. Verificando se o Prisma foi gerado..."
if [ -d "node_modules/.prisma" ] || [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Prisma Client gerado com sucesso!"
    echo "Conteúdo de node_modules/.prisma:"
    ls -la node_modules/.prisma/ || echo "Não encontrado"
else
    echo "❌ ERRO: Prisma Client não foi gerado"
    echo "Listando node_modules:"
    ls node_modules/ | grep -i prisma || echo "Nenhum arquivo Prisma encontrado"
    exit 1
fi

echo "5. Iniciando aplicação..."
node app.js