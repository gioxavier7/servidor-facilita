#!/bin/bash
cd /home/site/wwwroot

echo "=== DEPLOY AZURE - VERSÃO SIMPLIFICADA ==="
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# Corrigir o erro 'Permission denied' forçando a limpeza como root (sudo)
echo "1. Limpando instalação anterior e pastas problemáticas..."
sudo rm -rf node_modules _del_node_modules .prisma # Adicionado sudo e outras pastas do Oryx/Prisma
rm -f package-lock.json

echo "2. Instalando dependências (incluindo dev)..."
npm install --production=false --verbose

# O arquivo schema.prisma já foi configurado com o output customizado e SSL, agora é só gerar.
echo "3. Gerando Prisma Client..."
npx prisma generate 

echo "4. Verificação final com novo caminho..."
# O caminho de verificação foi atualizado para o 'output' definido em schema.prisma
if [ -f "prisma/generated/client/index.js" ]; then
    echo "✅ PRISMA CLIENT GERADO COM SUCESSO!"
else
    echo "❌ FALHA: Prisma Client não encontrado"
    echo "--- LOG DE ERRO PRISMA ---"
    # Tentar forçar o log de erro para entender o problema de conexão/binário, se ocorrer.
    npx prisma generate --verbose
    echo "--- FIM LOG DE ERRO PRISMA ---"
    exit 1
fi

echo "5. Iniciando aplicação..."
node app.js