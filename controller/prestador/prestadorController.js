/**
 * Controller responsável pelas regras e autentificação de prestador
 * Data: 16/09/2025
 * Dev: Giovanna
 * Versão: 1.1
 */

const prestadorDAO = require('../../model/dao/prestador')
const usuarioDAO = require('../../model/dao/usuario')
const jwt = require('jsonwebtoken');

// ================= CADASTRAR PRESTADOR =================
const cadastrarPrestador = async (req, res) => {
  try {
    const id_usuario = req.user.id; // do JWT
    const { localizacao, documento } = req.body;

    // validação básica de localizacao
    if (!localizacao || !Array.isArray(localizacao) || localizacao.length === 0) {
      return res.status(400).json({ message: 'É necessário informar pelo menos um local.' });
    }

    // validação CPF obrigatório dentro dos documento
    const cpfDoc = (documento || []).find(doc => doc.tipo_documento === 'CPF');
    if (!cpfDoc) {
      return res.status(400).json({ message: 'Documento CPF obrigatório.' });
    }

    const regexCPF = /^\d{11}$/; // apenas números
    if (!regexCPF.test(cpfDoc.valor)) {
      return res.status(400).json({ message: 'CPF inválido, use 11 dígitos numéricos.' });
    }

    const novoPrestador = await prestadorDAO.insertPrestador({
      id_usuario,
      localizacao,
      documento: documento || []
    });

    //bscar usuário atualizado com o tipo_conta correto
    const usuarioAtualizado = await usuarioDAO.selectByIdUsuario(id_usuario);

    //gerar novo token com tipo_conta atualizado
    const token = jwt.sign(
      { 
        id: usuarioAtualizado.id, 
        tipo_conta: usuarioAtualizado.tipo_conta, 
        email: usuarioAtualizado.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(201).json({
      message: 'Prestador criado com sucesso!',
      token,
      prestador: novoPrestador,
      usuario: usuarioAtualizado
    });

  } catch (error) {
    console.error('Erro ao cadastrar prestador:', error);
    
    if (error.message.includes('já existe') || 
        error.message.includes('já possui') ||
        error.message.includes('não encontrado') ||
        error.message.includes('CPF')) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' });
  }
};

// ================= LISTAR TODOS OS PRESTADORES =================
const listarPrestadores = async (req, res) => {
  try {
    const prestadores = await prestadorDAO.selectAllPrestadores()
    return res.status(200).json(prestadores)
  } catch (error) {
    console.error('Erro ao listar prestadores:', error)
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= BUSCAR PRESTADOR POR ID =================
const buscarPrestador = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const prestador = await prestadorDAO.selectPrestadorById(id)
    return res.status(200).json(prestador)
  } catch (error) {
    console.error('Erro ao buscar prestador:', error)
    if (error.message === 'Prestador não encontrado.') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= ATUALIZAR PRESTADOR =================
const atualizarPrestador = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { localizacao, documento } = req.body

    const prestadorAtualizado = await prestadorDAO.updatePrestador(id, { localizacao, documento })

    return res.status(200).json({
      message: 'Prestador atualizado com sucesso!',
      prestador: prestadorAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar prestador:', error)
    if (error.message === 'Prestador não encontrado.') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

// ================= DELETAR PRESTADOR =================
const deletarPrestador = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const prestadorDeletado = await prestadorDAO.deletePrestador(id)

    return res.status(200).json({
      message: 'Prestador deletado com sucesso!',
      prestador: prestadorDeletado
    })
  } catch (error) {
    console.error('Erro ao deletar prestador:', error)
    if (error.message === 'Prestador não encontrado.') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

module.exports = {
  cadastrarPrestador,
  listarPrestadores,
  buscarPrestador,
  atualizarPrestador,
  deletarPrestador
}
