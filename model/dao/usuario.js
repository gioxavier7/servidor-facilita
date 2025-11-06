/**
 * DAO responsável pelo CRUD de usuários usando Prisma
 * Data: 13/09/2025
 * Dev: Giovanna
 * Versão: 1.2
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ================= INSERIR USUÁRIO =================
const insertUsuario = async (usuario) => {
  try {
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: usuario.nome,
        email: usuario.email,
        senha_hash: usuario.senha_hash,
        telefone: usuario.telefone,
        tipo_conta: usuario.tipo_conta
      },
      include: {
        prestador: { include: { documento: true, localizacao: true } },
        contratante: true
      }
    })
    return novoUsuario
  } catch (error) {
    console.error('Erro ao inserir usuário:', error)
    if (error.code === 'P2002') {
      throw new Error(`O campo ${error.meta.target} já está em uso.`)
    }
    throw new Error('Erro interno ao inserir usuário.')
  }
}

// ================= DELETAR USUÁRIO =================
const deleteUsuario = async (id) => {
  try {
    const deletado = await prisma.usuario.delete({
      where: { id },
      include: {
        prestador: { include: { documento: true, localizacao: true } },
        contratante: true
      }
    })
    return deletado
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    throw new Error('Erro interno ao deletar usuário.')
  }
}

// ================= LISTAR TODOS USUÁRIOS =================
const selectAllUsuario = async () => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { id: 'desc' },
      include: {
        prestador: { include: { documento: true, localizacao: true } },
        contratante: true
      }
    })
    return usuarios
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    throw new Error('Erro interno ao listar usuários.')
  }
}

// ================= BUSCAR USUÁRIO POR ID =================
const selectByIdUsuario = async (id) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        prestador: { include: { documento: true, localizacao: true } },
        contratante: true
      }
    })
    if (!usuario) throw new Error('Usuário não encontrado.')
    return usuario
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error)
    throw new Error(error.message || 'Erro interno ao buscar usuário.')
  }
}

// ================= BUSCAR USUÁRIO POR EMAIL =================
const selectByEmail = async (email) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        prestador: { include: { documento: true, localizacao: true } },
        contratante: true
      }
    })
    if (!usuario) return null
    return usuario
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error)
    return null
  }
}

// ================= BUSCAR USUÁRIO POR TELEFONE =================
const selectByTelefone = async (telefone) => {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { telefone },
      include: {
        prestador: { include: { documento: true, localizacao: true } },
        contratante: true
      }
    })
    return usuario // ⬅️ Retorna null se não encontrar
  } catch (error) {
    console.error('Erro ao buscar usuário por telefone:', error)
    return null
  }
}

// ================= ATUALIZAR PERFIL =================
const updateUsuario = async (id, dados) => {
  try {
    return await prisma.usuario.update({
      where: { id },
      data: dados,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        tipo_conta: true,
        criado_em: true
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        throw new Error('Email já existe');
      }
      if (error.meta?.target?.includes('telefone')) {
        throw new Error('Telefone já existe');
      }
    }
    throw error;
  }
};
// ================= ATUALIZAR SENHA =================
const updaterSenha = async (usuarioId, novaSenhaHash) => {
  try {
    const atualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { senha_hash: novaSenhaHash }
    });
    return atualizado;
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    throw new Error('Erro interno ao atualizar a senha.');
  }
};

// ================= CRIAR CÓDIGO PARA RECUPERAÇAO =================
async function criarCodigo(usuario_id, codigo, expira) {
  return await prisma.recuperacaoSenha.create({
    data: {
      codigo,
      expira,
      usuario: {
        connect: { id: usuario_id }
      }
    }
  })
}


// ================= BUSCAR CODIGO VÁLIDO =================
async function buscarCodigo(usuario_id, codigo) {
  return await prisma.recuperacaoSenha.findFirst({
    where: {
      usuarioId: usuario_id,
      codigo,
      usado: false,
      expira: {
        gte: new Date()
      }
    },
    orderBy: {
      criadoEm: 'desc'
    }
  })
}


// ================= MARCAR COMO CÓDIGO USADO =================
async function marcarComoUsado(id) {
  return await prisma.recuperacaoSenha.update({
    where: { id },
    data: { usado: true }
  })
}

// Model - CORRIGIDO
const buscarCodigoPorNumero = async (codigo) => {
  try {
    const registros = await prisma.recuperacaoSenha.findMany({
      where: {
        codigo: codigo
      },
      include: {
        usuario: true
      }
    });
    
    return registros || []
  } catch (error) {
    console.error('Erro ao buscar código:', error);
    return []
  }
}
// ================= BUSCAR USUÁRIO COMPLETO POR ID =================
// ================= BUSCAR USUÁRIO COMPLETO POR ID =================
const buscarUsuarioCompletoPorId = async (id) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        carteira: true,
        contratante: {
          include: {
            localizacao: true
          }
        },
        prestador: {
          include: {
            documento: true,
            modalidades: true,
            localizacao: true
          }
        }
      }
    })
    
    return usuario;
  } catch (error) {
    console.error('Erro no DAO ao buscar usuário completo:', error);
    throw error;
  }
};
module.exports = {
  insertUsuario,
  updateUsuario,
  deleteUsuario,
  selectAllUsuario,
  selectByIdUsuario,
  selectByEmail,
  selectByTelefone,
  updaterSenha,
  criarCodigo,
  buscarCodigo,
  marcarComoUsado,
  buscarCodigoPorNumero,
  buscarUsuarioCompletoPorId
}
