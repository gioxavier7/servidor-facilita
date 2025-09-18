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
 * Atualiza o perfil do usuário (dados básicos + contratante/prestador)
 * Apenas os campos enviados em `dados` serão atualizados
 * @param {number} usuarioId - ID do usuário
 * @param {object} dados - Dados a atualizar
 * @returns {object} - { message, usuario } ou { error }
 */
const updatePerfil = async (usuarioId, dados) => {
  try {
    // 0) Checa se o email já existe em outro usuário
    if (dados.email) {
      const emailExistente = await prisma.usuario.findUnique({
        where: { email: dados.email }
      });
      if (emailExistente && emailExistente.id !== usuarioId) {
        return { error: "Email já está em uso por outro usuário." };
      }
    }

    // 1) Atualiza dados básicos do usuário (apenas os que vierem)
    const dadosParaAtualizar = {};
    if (dados.nome) dadosParaAtualizar.nome = dados.nome;
    if (dados.email) dadosParaAtualizar.email = dados.email;
    if (dados.telefone) dadosParaAtualizar.telefone = dados.telefone;
    if (dados.senha_hash) dadosParaAtualizar.senha_hash = dados.senha_hash;

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: dadosParaAtualizar
    });

    // 2) Se for contratante e houver dados para atualizar
    if (usuarioAtualizado.tipo_conta === 'CONTRATANTE') {
      const dadosContratante = {};
      if (dados.necessidade) dadosContratante.necessidade = dados.necessidade;
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
        };
      }

      if (Object.keys(dadosContratante).length > 0) {
        await prisma.contratante.update({
          where: { id_usuario: usuarioId },
          data: dadosContratante
        });
      }
    }

    // 3) Se for prestador e houver dados para atualizar
    if (usuarioAtualizado.tipo_conta === 'PRESTADOR') {
      const dadosPrestador = {};

      // Documentos
      if (dados.documentos) {
        dadosPrestador.documentos = {
          updateMany: dados.documentos
            .filter(d => d.action === "update")
            .map(d => ({
              where: { id: d.id },
              data: {
                valor: d.valor,
                data_validade: d.data_validade ? new Date(d.data_validade) : null,
                arquivo_url: d.arquivo_url || null
              }
            })),
          create: dados.documentos
            .filter(d => d.action === "create")
            .map(d => ({
              tipo_documento: d.tipo_documento,
              valor: d.valor,
              data_validade: d.data_validade ? new Date(d.data_validade) : null,
              arquivo_url: d.arquivo_url || null
            })),
          deleteMany: dados.documentos
            .filter(d => d.action === "delete")
            .map(d => ({ id: d.id }))
        };
      }

      // Locais
      if (dados.locais) {
        dadosPrestador.locais = {
          connect: dados.locais
            .filter(l => l.action === "connect")
            .map(l => ({ id: l.id })),
          disconnect: dados.locais
            .filter(l => l.action === "disconnect")
            .map(l => ({ id: l.id })),
          set: dados.locais.some(l => l.action === "set")
            ? dados.locais.filter(l => l.action === "set").map(l => ({ id: l.id }))
            : undefined
        };
      }

      if (Object.keys(dadosPrestador).length > 0) {
        await prisma.prestador.update({
          where: { id_usuario: usuarioId },
          data: dadosPrestador
        });
      }
    }

    // 4) Busca o usuário completo atualizado (com relações)
    const usuarioCompleto = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        prestador: { include: { documentos: true, locais: true } },
        contratante: { include: { localizacao: true } }
      }
    });

    return { message: "Perfil atualizado com sucesso", usuario: usuarioCompleto };
  } catch (error) {
    console.error("Erro no updatePerfil DAO:", error);

    // Captura erro de constraint unique do Prisma (P2002)
    if (error.code === "P2002") {
      return { error: `O campo ${error.meta.target} já está em uso.` };
    }

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
  updatePerfil
}