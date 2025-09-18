/**
 * objetivo: DAO responsável pelo CRUD de usuários usando Prisma
 * data: 13/09/2025
 * dev: Giovanna
 * versão: 1.1
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Cadastra um novo usuário
 * @param {Object} usuario - {nome, email, senha_hash, telefone, tipo_conta}
 * @returns {Object|false} - usuário criado (com relacionamentos) ou false
 */
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
    console.error("Erro ao inserir usuário:", error)
    return false
  }
}

/**
 * Atualiza um usuário existente
 * @param {Object} usuario - {id, nome, email, senha_hash, telefone, tipo_conta}
 * @returns {Object|false} - usuário atualizado (com relacionamentos) ou false
 */
const updateUsuario = async (id, data) => {
    try {
      const atualizado = await prisma.usuario.update({
        where: { id: id },
        data: data,
        include: {
          prestador: { include: { documentos: true, locais: true } },
          contratante: true
        }
      })
      return atualizado
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      return false
    }
  }
  

/**
 * Deleta um usuário pelo ID
 * @param {number} id
 * @returns {Object|false} - usuário deletado (com relacionamentos) ou false
 */
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
    console.error("Erro ao deletar usuário:", error)
    return false
  }
}

/**
 * Retorna todos os usuários
 * @returns {Array|false} - lista de usuários com relacionamentos ou false
 */
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
    console.error("Erro ao buscar usuários:", error)
    return false
  }
}

/**
 * Retorna um usuário pelo ID
 * @param {number} id
 * @returns {Object|false} - usuário com relacionamentos ou false
 */
const selectByIdUsuario = async (id) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        prestador: { include: { documentos: true, locais: true } },
        contratante: true
      }
    })
    return usuario || false
  } catch (error) {
    console.error("Erro ao buscar usuário por ID:", error)
    return false
  }
}

/**
 * Retorna um usuário pelo email (para login)
 * @param {string} email
 * @returns {Object|false} - usuário com relacionamentos ou false
 */
const selectByEmail = async (email) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        prestador: { include: { documentos: true, locais: true } },
        contratante: true
      }
    })
    return usuario || false
  } catch (error) {
    console.error("Erro ao buscar usuário por email:", error)
    return false
  }
}

/**
 * Retorna um usuário pelo telefone (para login)
 * @param {string} telefone
 * @returns {Object|false} - usuário com relacionamentos ou false
 */
const selectByTelefone = async (telefone) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { telefone },
      include: {
        prestador: { include: { documentos: true, locais: true } },
        contratante: true
      }
    })
    return usuario || false
  } catch (error) {
    console.error('Erro ao buscar usuário por telefone:', error)
    return false
  }
}

/**
 * Atualiza o tipo de conta de um usuário
 * @param {number} id - ID do usuário
 * @param {string} tipoConta - "CONTRATANTE" ou "PRESTADOR"
 * @returns {Object|false} - usuário atualizado ou false
 */
const atualizarTipoConta = async (id, tipoConta) => {
  try {
    const atualizado = await prisma.usuario.update({
      where: { id },
      data: { tipo_conta: tipoConta }
    })

    return atualizado
  } catch (error) {
    console.error("Erro ao atualizar tipo de conta:", error)
    return false
  }
}

module.exports = {
  insertUsuario,
  updateUsuario,
  deleteUsuario,
  selectAllUsuario,
  selectByIdUsuario,
  selectByEmail,
  selectByTelefone,
  atualizarTipoConta
}