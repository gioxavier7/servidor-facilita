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
        prestador: { include: { documentos: true, locais: true } },
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

// ================= ATUALIZAR USUÁRIO =================
const updateUsuario = async (id, data) => {
  try {
    const atualizado = await prisma.usuario.update({
      where: { id },
      data,
      include: {
        prestador: { include: { documentos: true, locais: true } },
        contratante: true
      }
    })
    return atualizado
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    if (error.code === 'P2002') {
      throw new Error(`O campo ${error.meta.target} já está em uso.`)
    }
    throw new Error('Erro interno ao atualizar usuário.')
  }
}

// ================= DELETAR USUÁRIO =================
const deleteUsuario = async (id) => {
  try {
    const deletado = await prisma.usuario.delete({
      where: { id },
      include: {
        prestador: { include: { documentos: true, locais: true } },
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
        prestador: { include: { documentos: true, locais: true } },
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
        prestador: { include: { documentos: true, locais: true } },
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
        prestador: { include: { documentos: true, locais: true } },
        contratante: true
      }
    })
    if (!usuario) throw new Error('Usuário não encontrado.')
    return usuario
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error)
    throw new Error(error.message || 'Erro interno ao buscar usuário por email.')
  }
}

// ================= BUSCAR USUÁRIO POR TELEFONE =================
const selectByTelefone = async (telefone) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { telefone },
      include: {
        prestador: { include: { documentos: true, locais: true } },
        contratante: true
      }
    })
    if (!usuario) throw new Error('Usuário não encontrado.')
    return usuario
  } catch (error) {
    console.error('Erro ao buscar usuário por telefone:', error)
    throw new Error(error.message || 'Erro interno ao buscar usuário por telefone.')
  }
}

// ================= ATUALIZAR PERFIL =================
const updatePerfil = async (usuarioId, dados) => {
  try {
    // 0) Checa se o email já existe em outro usuário
    if (dados.email) {
      const emailExistente = await prisma.usuario.findUnique({
        where: { email: dados.email }
      })
      if (emailExistente && emailExistente.id !== usuarioId) {
        throw new Error('Email já está em uso por outro usuário.')
      }
    }

    // 1) Atualiza dados básicos
    const dadosParaAtualizar = {}
    if (dados.nome) dadosParaAtualizar.nome = dados.nome
    if (dados.email) dadosParaAtualizar.email = dados.email
    if (dados.telefone) dadosParaAtualizar.telefone = dados.telefone
    if (dados.senha_hash) dadosParaAtualizar.senha_hash = dados.senha_hash

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: dadosParaAtualizar
    })

    // 2) Atualiza contratante
    if (usuarioAtualizado.tipo_conta === 'CONTRATANTE') {
      const dadosContratante = {}
      if (dados.necessidade) dadosContratante.necessidade = dados.necessidade
      if (dados.localizacao) {
        dadosContratante.localizacao = {
          update: {
            logradouro: dados.localizacao.logradouro,
            numero: dados.localizacao.numero,
            bairro: dados.localizacao.bairro,
            cidade: dados.localizacao.cidade,
            cep: dados.localizacao.cep,
            latitude: dados.localizacao.latitude,
            longitude: dados.localizacao.longitude
          }
        }
      }
      if (Object.keys(dadosContratante).length > 0) {
        await prisma.contratante.update({
          where: { id_usuario: usuarioId },
          data: dadosContratante
        })
      }
    }

    // 3) Atualiza prestador
    if (usuarioAtualizado.tipo_conta === 'PRESTADOR') {
      const dadosPrestador = {}

      if (dados.documentos) {
        dadosPrestador.documentos = {
          updateMany: dados.documentos
            .filter(d => d.action === 'update')
            .map(d => ({
              where: { id: d.id },
              data: {
                valor: d.valor,
                data_validade: d.data_validade ? new Date(d.data_validade) : null,
                arquivo_url: d.arquivo_url || null
              }
            })),
          create: dados.documentos
            .filter(d => d.action === 'create')
            .map(d => ({
              tipo_documento: d.tipo_documento,
              valor: d.valor,
              data_validade: d.data_validade ? new Date(d.data_validade) : null,
              arquivo_url: d.arquivo_url || null
            })),
          deleteMany: dados.documentos
            .filter(d => d.action === 'delete')
            .map(d => ({ id: d.id }))
        }
      }

      if (dados.locais) {
        dadosPrestador.locais = {
          connect: dados.locais.filter(l => l.action === 'connect').map(l => ({ id: l.id })),
          disconnect: dados.locais.filter(l => l.action === 'disconnect').map(l => ({ id: l.id })),
          set: dados.locais.some(l => l.action === 'set')
            ? dados.locais.filter(l => l.action === 'set').map(l => ({ id: l.id }))
            : undefined
        }
      }

      if (Object.keys(dadosPrestador).length > 0) {
        await prisma.prestador.update({
          where: { id_usuario: usuarioId },
          data: dadosPrestador
        })
      }
    }

    // 4) Retorna usuário completo
    const usuarioCompleto = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        prestador: { include: { documentos: true, locais: true } },
        contratante: { include: { localizacao: true } }
      }
    })

    return { message: 'Perfil atualizado com sucesso', usuario: usuarioCompleto }
  } catch (error) {
    console.error('Erro no updatePerfil DAO:', error)
    throw new Error(error.message || 'Erro interno ao atualizar perfil.')
  }
}

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


module.exports = {
  insertUsuario,
  updateUsuario,
  deleteUsuario,
  selectAllUsuario,
  selectByIdUsuario,
  selectByEmail,
  selectByTelefone,
  updatePerfil,
  updaterSenha
}
