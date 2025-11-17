#!/bin/bash
cd /home/site/wwwroot

echo "=== DEPLOY AZURE - VERSAO SIMPLIFICADA (FINAL) ==="
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# 1. Limpando instalacao anterior e pastas problematicas:
# O comando 'sudo' foi REMOVIDO pois nao e suportado no container do Azure App Service.
echo "1. Limpando instalacao anterior e pastas problematicas..."
rm -rf node_modules _del_node_modules .prisma
rm -f package-lock.json

echo "2. Instalando dependencias (incluindo dev)..."
npm install --production=false --verbose

# 3. Gerando Prisma Client:
# Isso usara a configuracao SSL e o 'output' customizado do seu schema.prisma.
echo "3. Gerando Prisma Client..."
npx prisma generate 

echo "4. Verificacao final com novo caminho..."
# Verifica se o arquivo foi gerado no caminho customizado: prisma/generated/client/index.js
if [ -f "prisma/generated/client/index.js" ]; then
    echo "✅ PRISMA CLIENT GERADO COM SUCESSO!"
else
    echo "❌ FALHA: Prisma Client nao encontrado"
    echo "--- LOG DE ERRO PRISMA ---"
    # Tenta o verbose novamente em caso de falha para diagnostico
    npx prisma generate --verbose
    echo "--- FIM LOG DE ERRO PRISMA ---"
    exit 1
fi

echo "5. Iniciando aplicacao..."
node app.js