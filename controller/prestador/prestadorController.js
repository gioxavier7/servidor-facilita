/**
 * Controller responsável pelas regras e autentificação de prestador
 * Data: 16/09/2025
 * Dev: Giovanna
 * Versão: 2.0 - Atualizado para novo schema
 */

const prestadorDAO = require('../../model/dao/prestador')
const usuarioDAO = require('../../model/dao/usuario')
const cnhDAO = require('../../model/dao/cnh')
const jwt = require('jsonwebtoken');

// ================= CRIAR PRESTADOR BÁSICO (sem documentos nem CNH) =================
const criarPrestadorBasico = async (req, res) => {
  try {
    const id_usuario = req.user.id;
    const { localizacao } = req.body;

    if (!localizacao || !Array.isArray(localizacao) || localizacao.length === 0) {
      return res.status(400).json({ message: 'É necessário informar pelo menos um local.' });
    }

    const prestador = await prestadorDAO.insertPrestadorBasico({
      id_usuario,
      localizacao
    });

    return res.status(201).json({
      message: 'Prestador criado com sucesso! Continue adicionando os dados.',
      prestador
    });
  } catch (error) {
    console.error('Erro ao criar prestador básico:', error);
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' });
  }
};

// ================= ADICIONAR CNH AO PRESTADOR =================
const cadastrarCNH = async (req, res) => {
  try {
    const id_usuario = req.user.id
    const { numero_cnh, categoria, validade, possui_ear } = req.body

    if (!numero_cnh || !categoria || !validade) {
      return res.status(400).json({ message: 'Dados da CNH incompletos.' })
    }

    const prestador = await prestadorDAO.buscarPrestadorPorUsuario(id_usuario)
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador não encontrado.' })
    }

    const novaCNH = await cnhDAO.insertCNH({
      id_prestador: prestador.id,
      numero_cnh,
      categoria,
      validade: new Date(validade),
      possui_ear: possui_ear || false,
    })

    return res.status(201).json({
      message: 'CNH cadastrada com sucesso!',
      cnh: novaCNH,
    })
  } catch (error) {
    console.error('Erro ao cadastrar CNH:', error)
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

const adicionarModalidades = async (req, res) => {
  try {
    const id_usuario = req.user.id
    const { modalidades } = req.body

    if (!modalidades || !Array.isArray(modalidades) || modalidades.length === 0) {
      return res.status(400).json({ message: 'Modalidades são obrigatórias.' })
    }

    const prestador = await prestadorDAO.buscarPrestadorPorUsuario(id_usuario)
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador não encontrado.' })
    }

    const modalidadesAdicionadas = await prestadorDAO.adicionarModalidades(prestador.id, modalidades)

    return res.status(200).json({
      message: 'Modalidades adicionadas com sucesso!',
      modalidades: modalidadesAdicionadas
    })
  } catch (error) {
    console.error('Erro ao adicionar modalidades:', error)
    return res.status(500).json({
      message: error.message || 'Erro interno no servidor.'
    })
  }
}

// ================= FINALIZAR CADASTRO =================
const finalizarCadastro = async (req, res) => {
  try {
    const id_usuario = req.user.id

    const prestador = await prestadorDAO.buscarPrestadorPorUsuario(id_usuario)
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador não encontrado.' })
    }

    const prestadorFinalizado = await prestadorDAO.finishCadastro(prestador.id)
    
    // Gerar novo token JWT com tipo_conta atualizado
    const novoToken = jwt.sign(
      {
        id: id_usuario,
        tipo_conta: 'PRESTADOR', // AGORA ATUALIZADO
        email: req.user.email,
        id_prestador: prestador.id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )

    return res.status(200).json({
      message: 'Cadastro finalizado com sucesso!',
      prestador: prestadorFinalizado,
      token: novoToken
    })
  } catch (error) {
    console.error('Erro ao finalizar cadastro:', error)
    return res.status(500).json({
      message: error.message || 'Erro interno no servidor.'
    })
  }
}

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
    const userId = req.user.id; // vem do token JWT
    console.log('Usuário autenticado ID:', userId);

    const prestador = await prestadorDAO.selectPrestadorByUsuarioId(Number(userId));

    if (!prestador) {
      return res.status(404).json({ message: 'Prestador não encontrado.' });
    }

    res.status(200).json(prestador);
  } catch (error) {
    console.error('Erro ao buscar prestador:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= BUSCAR PRESTADOR POR USUÁRIO =================
const buscarPrestadorPorUsuario = async (req, res) => {
  try {
    const id_usuario = req.user.id;
    const prestador = await prestadorDAO.selectPrestadorCompletoByUsuarioId(id_usuario);
    
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador não encontrado.' });
    }

    return res.status(200).json(prestador);
  } catch (error) {
    console.error('Erro ao buscar prestador:', error);
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' });
  }
};

// ================= ATUALIZAR PRESTADOR =================
const atualizarPrestador = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { localizacao, documento, modalidades } = req.body

    const prestadorAtualizado = await prestadorDAO.updatePrestador(id, { 
      localizacao, 
      documento,
      modalidades 
    })

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
  criarPrestadorBasico,
  cadastrarCNH,
  adicionarModalidades,
  finalizarCadastro,
  listarPrestadores,
  buscarPrestador,
  buscarPrestadorPorUsuario,
  atualizarPrestador,
  deletarPrestador
}