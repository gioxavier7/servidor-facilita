const fs = require('fs')
const { execSync } = require('child_process')

const env = process.argv[2] || 'development'
const envFile = `.env.${env}`

// Carrega o arquivo de ambiente
require('dotenv').config({ path: envFile })

// No Railway, usa MYSQL_PUBLIC_URL se disponível
if (env === 'production') {
  process.env.DATABASE_URL = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL
}

console.log(`Usando variáveis de ${envFile}`)
console.log(`Database URL: ${process.env.DATABASE_URL}`)

try {
  if (env === 'production') {
    console.log('Aplicando migrations no modo produção...')
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: process.env
    })
  } else {
    console.log('Aplicando migrations no modo dev...')
    execSync('npx prisma migrate dev --name update', { 
      stdio: 'inherit',
      env: process.env
    })
  }
} catch (err) {
  console.error('Erro ao rodar migrate:', err)
  process.exit(1)
}