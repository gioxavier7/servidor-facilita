/**
 * objetivo: controller responsável pelo CRUD de localizacao
 * data: 25/09/2025
 * dev: giovanna
 * versão: 1.0
 */

const localizacaoDAO = require('../../model/dao/localizacao');

// ================ CREATE =================
const criarLocalizacao = async (req, res) => {
  try {
    const data = req.body;
    const localizacao = await localizacaoDAO.createLocalizacao(data);
    res.status(201).json(localizacao);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar localizacao' });
  }
};

// ================ LISTAR TODOS =================
const listarLocalizacoes = async (req, res) => {
  try {
    const locais = await localizacaoDAO.selectAllLocalizacoes();
    res.json(locais);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar localizacoes' });
  }
};

// ================ BUSCAR POR ID =================
const buscarLocalizacao = async (req, res) => {
  try {
    const id = req.params.id;
    const local = await localizacaoDAO.selectByIdLocalizacao(id);
    if (!local) return res.status(404).json({ error: 'Localizacao não encontrada' });
    res.json(local);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar localizacao' });
  }
};

// ================ ATUALIZAR =================
const atualizarLocalizacao = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const local = await localizacaoDAO.updateLocalizacao(id, data);
    res.json(local);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar localizacao' });
  }
};

// ================ DELETAR =================
const deletarLocalizacao = async (req, res) => {
  try {
    const id = req.params.id;
    await localizacaoDAO.deleteLocalizacao(id);
    res.json({ message: 'Localizacao deletada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar localizacao' });
  }
};

module.exports = {
  criarLocalizacao,
  listarLocalizacoes,
  buscarLocalizacao,
  atualizarLocalizacao,
  deletarLocalizacao,
};
