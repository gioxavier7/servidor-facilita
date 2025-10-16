const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Atualizar categorias existentes
  await prisma.categoria.upsert({
    where: { nome: 'Farmácia' },
    update: {
      descricao: 'Buscar medicamentos e produtos de saúde',
      icone: 'local_hospital',
      preco_base: 25.00,
      tempo_medio: 45
    },
    create: {
      nome: 'Farmácia',
      descricao: 'Buscar medicamentos e produtos de saúde',
      icone: 'local_hospital',
      preco_base: 25.00,
      tempo_medio: 45
    }
  })

  await prisma.categoria.upsert({
    where: { nome: 'Mercado' },
    update: {
      descricao: 'Fazer compras e entregar em casa',
      icone: 'shopping_cart',
      preco_base: 35.00,
      tempo_medio: 90
    },
    create: {
      nome: 'Mercado',
      descricao: 'Fazer compras e entregar em casa',
      icone: 'shopping_cart',
      preco_base: 35.00,
      tempo_medio: 90
    }
  })

  await prisma.categoria.upsert({
    where: { nome: 'Transporte' },
    update: {
      descricao: 'Levo você ou suas encomendas onde precisar',
      icone: 'directions_car',
      preco_base: 20.00,
      tempo_medio: 30
    },
    create: {
      nome: 'Transporte',
      descricao: 'Levo você ou suas encomendas onde precisar',
      icone: 'directions_car',
      preco_base: 20.00,
      tempo_medio: 30
    }
  })

  console.log('✅ Categorias atualizadas com sucesso!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })