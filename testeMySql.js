// test-mysql-auth.js
const mysql = require('mysql2');

const connectionConfig = {
  host: 'nozomi.proxy.rlwy.net',
  port: 18972,
  user: 'root',
  password: 'jeOcFDJEvfqFKjjaFgMBqawZGvzARDHf',
  database: 'railway',
  connectTimeout: 10000,
  timeout: 10000
};

console.log('🔐 Testando credenciais MySQL...');
console.log('Configuração:', {
  host: connectionConfig.host,
  port: connectionConfig.port,
  user: connectionConfig.user,
  database: connectionConfig.database
});

const connection = mysql.createConnection(connectionConfig);

connection.connect((err) => {
  if (err) {
    console.error('❌ Erro de autenticação MySQL:');
    console.error('Código:', err.code);
    console.error('Mensagem:', err.message);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n👉 PROBLEMA: Credenciais inválidas!');
      console.log('👉 SOLUÇÃO: Verifique no painel do Railway se a senha ainda é a mesma');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('\n👉 PROBLEMA: Database não existe!');
      console.log('👉 SOLUÇÃO: Verifique se o database "railway" existe');
    }
    
    process.exit(1);
  }
  
  console.log('✅ Autenticação MySQL bem-sucedida!');
  console.log('✅ Conectado ao banco de dados');
  
  // Testa uma query simples
  connection.query('SELECT DATABASE() as db, USER() as user', (err, results) => {
    if (err) {
      console.error('Erro na query:', err);
    } else {
      console.log('✅ Query de teste funcionou:');
      console.log('Database:', results[0].db);
      console.log('Usuário:', results[0].user);
    }
    
    connection.end();
    console.log('\n🎯 O problema está no Prisma! Vamos verificar o schema...');
  });
});