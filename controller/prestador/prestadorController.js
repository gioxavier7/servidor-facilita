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

// ================= CADASTRAR PRESTADOR COMPLETO =================
const cadastrarPrestador = async (req, res) => {
  try {
    const id_usuario = req.user.id; // do JWT
    const { localizacao, documento, cnh, modalidades } = req.body;

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

    // validação CNH obrigatória se tiver modalidades que exigem
    const modalidadesVeiculo = modalidades?.filter(m => m !== 'A_PE' && m !== 'BICICLETA');
    if (modalidadesVeiculo && modalidadesVeiculo.length > 0 && !cnh) {
      return res.status(400).json({ message: 'CNH obrigatória para modalidades com veículo.' });
    }

    const novoPrestador = await prestadorDAO.insertPrestador({
      id_usuario,
      localizacao,
      documento: documento || [],
      cnh: cnh || null,
      modalidades: modalidades || []
    });

    // buscar usuário atualizado com o tipo_conta correto
    const usuarioAtualizado = await usuarioDAO.selectByIdUsuario(id_usuario);

    // gerar novo token com tipo_conta atualizado
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
        error.message.includes('CPF') ||
        error.message.includes('CNH')) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' });
  }
};

// ================= ADICIONAR CNH AO PRESTADOR =================
const cadastrarCNH = async (req, res) => {
  try {
    const id_prestador = parseInt(req.params.id);
    const { numero_cnh, categoria, validade, possui_ear } = req.body;

    if (!numero_cnh || !categoria || !validade) {
      return res.status(400).json({ message: 'Dados da CNH incompletos.' });
    }

    const novaCNH = await cnhDAO.insertCNH({
      id_prestador,
      numero_cnh,
      categoria,
      validade: new Date(validade),
      possui_ear: possui_ear || false
    });

    return res.status(201).json({
      message: 'CNH cadastrada com sucesso!',
      cnh: novaCNH
    });
  } catch (error) {
    console.error('Erro ao cadastrar CNH:', error);
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' });
  }
};

// ================= ADICIONAR MODALIDADES =================
const adicionarModalidades = async (req, res) => {
  try {
    const id_prestador = parseInt(req.params.id);
    const { modalidades } = req.body;

    if (!modalidades || !Array.isArray(modalidades) || modalidades.length === 0) {
      return res.status(400).json({ message: 'Modalidades são obrigatórias.' });
    }

    const modalidadesAdicionadas = await prestadorDAO.adicionarModalidades(id_prestador, modalidades);

    return res.status(200).json({
      message: 'Modalidades adicionadas com sucesso!',
      modalidades: modalidadesAdicionadas
    });
  } catch (error) {
    console.error('Erro ao adicionar modalidades:', error);
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
  cadastrarPrestador,
  cadastrarCNH,
  adicionarModalidades,
  listarPrestadores,
  buscarPrestador,
  buscarPrestadorPorUsuario,
  atualizarPrestador,
  deletarPrestador
}