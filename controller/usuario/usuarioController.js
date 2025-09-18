/**
 * Controller de Usuario
 * Fluxo:
 *  - Cadastro básico
 *  - Login
 *  - Listagem / CRUD
 */

const usuarioDAO = require('../../model/dao/usuario')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()

// ================= CADASTRAR USUARIO =================
const cadastrarUsuario = async (req, res) => {
  try {
    const { nome, email, telefone, senha_hash } = req.body

    if (!nome || !email || !telefone || !senha_hash) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' })
    }

    const senha = await bcrypt.hash(senha_hash, 10)

    const usuario = await usuarioDAO.insertUsuario({
      nome,
      email,
      telefone,
      senha_hash: senha,
      tipo_conta: null
    })

    if (!usuario) {
      return res.status(500).json({ error: 'Erro ao cadastrar usuário.' })
    }

    // gerar token JWT
    const token = jwt.sign(
      { id: usuario.id, tipo_conta: usuario.tipo_conta },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      token,
      usuario,
      proximo_passo: usuario.tipo_conta === 'CONTRATANTE'
        ? 'completar_perfil_contratante'
        : 'completar_perfil_prestador'
    })
  } catch (error) {
    console.error('Erro ao cadastrar usuario:', error)
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' })
  }
}

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, senha } = req.body

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' })
    }

    const usuario = await usuarioDAO.selectByEmail(email)
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' })

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)
    if (!senhaCorreta) return res.status(401).json({ error: 'Senha incorreta.' })

    const token = jwt.sign(
      { id: usuario.id, tipo_conta: usuario.tipo_conta },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      usuario,
      proximo_passo: usuario.tipo_conta === 'CONTRATANTE'
        ? 'completar_perfil_contratante'
        : 'completar_perfil_prestador'
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return res.status(500).json({ error: 'Erro interno no login.' })
  }
}

// ================= LISTAR USUARIOS =================
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioDAO.selectAllUsuario()
    return res.status(200).json(usuarios)
  } catch (error) {
    console.error('Erro ao listar usuarios:', error)
    return res.status(500).json({ error: 'Erro interno ao listar usuários.' })
  }
}

// ================= GET USUARIO POR ID =================
const buscarUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const usuario = await usuarioDAO.selectByIdUsuario(parseInt(id))

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    // só permite ver o próprio usuário
    if (req.usuario.id !== usuario.id) {
      return res.status(403).json({ error: 'Acesso negado.' })
    }

    return res.status(200).json(usuario)
  } catch (error) {
    console.error('Erro ao buscar usuario:', error)
    return res.status(500).json({ error: 'Erro interno ao buscar usuário.' })
  }
}

// ================= ATUALIZAR USUARIO =================
const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params

    // só permite atualizar o próprio usuário
    if (req.usuario.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Acesso negado.' })
    }

    const data = req.body
    if (data.senha_hash) {
      data.senha_hash = await bcrypt.hash(data.senha_hash, 10)
    }

    const usuarioAtualizado = await usuarioDAO.updateUsuario(parseInt(id), data)
    if (!usuarioAtualizado) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    return res.status(200).json({
      message: 'Usuário atualizado com sucesso!',
      usuario: usuarioAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar usuario:', error)
    return res.status(500).json({ error: 'Erro interno ao atualizar usuário.' })
  }
}

// ================= DELETAR USUARIO =================
const deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params

    // só permite deletar o próprio usuário
    if (req.usuario.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Acesso negado.' })
    }

    const deletado = await usuarioDAO.deleteUsuario(parseInt(id))
    if (!deletado) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    return res.status(200).json({ message: 'Usuário deletado com sucesso!' })
  } catch (error) {
    console.error('Erro ao deletar usuario:', error)
    return res.status(500).json({ error: 'Erro interno ao deletar usuário.' })
  }
}

// ================= ATUALIZAR PERFIL =================
const atualizarPerfil = async (req, res) => {
  try {
    const usuarioId = parseInt(req.params.id)

    // só permite atualizar o próprio usuário
    if (req.usuario.id !== usuarioId) {
      return res.status(403).json({ error: 'Acesso negado.' })
    }

    const dados = req.body
    if (dados.senha_hash) {
      dados.senha_hash = await bcrypt.hash(dados.senha_hash, 10)
    }

    const resultado = await usuarioDAO.updatePerfil(usuarioId, dados)

    if (resultado.error) {
      return res.status(400).json({ error: resultado.error })
    }

    return res.status(200).json(resultado)
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return res.status(500).json({ error: 'Erro interno ao atualizar perfil.' })
  }
}
module.exports = {
  cadastrarUsuario,
  login,
  listarUsuarios,
  buscarUsuario,
  atualizarUsuario,
  deletarUsuario,
  atualizarPerfil
}