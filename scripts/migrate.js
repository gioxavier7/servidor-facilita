const fs = require('fs')
const { execSync } = require('child_process')

const env = process.argv[2] || 'development' // default dev
const envFile = `.env.${env}`

// Verifica se o arquivo existe
if (!fs.existsSync(envFile)) {
  console.error(`Arquivo ${envFile} não encontrado!`)
  process.exit(1)
}

// Copia o arquivo para .env
fs.copyFileSync(envFile, '.env')
console.log(`Usando variáveis de ${envFile}`)

try {
  if (env === 'production') {
    console.log('Aplicando migrations no modo produção...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  } else {
    console.log('Aplicando migrations no modo dev...')
    execSync('npx prisma migrate dev --name create_recuperacao_senha', { stdio: 'inherit' })
  }
} catch (err) {
  console.error('Erro ao rodar migrate:', err)
  process.exit(1)
}