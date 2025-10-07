const avaliacaoDAO = require('../../model/dao/avaliacao');
const servicoDAO = require('../../model/dao/servico');
const contratanteDAO = require('../../model/dao/contratante');
const prestadorDAO = require('../../model/dao/prestador');

/**
 * avaliar um serviço (apenas contratante que usou o serviço)
 */
const avaliarServico = async (req, res) => {
  try {
    const { id_servico, nota, comentario } = req.body;
    const id_contratante = req.user.id;

    // validações
    if (!id_servico || !nota) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'ID do serviço e nota são obrigatórios' 
      });
    }

    if (nota < 1 || nota > 5) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'Nota deve ser entre 1 e 5' 
      });
    }

    //buscar serviço
    const servico = await servicoDAO.selectByIdServico(id_servico);
    if (!servico) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Serviço não encontrado' 
      });
    }

    //verificar se o contratante é o dono do serviço
    const contratante = await contratanteDAO.selectContratanteByUsuarioId(id_contratante);
    if (servico.id_contratante !== contratante.id) {
      return res.status(403).json({ 
        status_code: 403, 
        message: 'Apenas o contratante do serviço pode avaliar' 
      });
    }

    //verificar se serviço está finalizado
    if (servico.status !== 'FINALIZADO') {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'Apenas serviços finalizados podem ser avaliados' 
      });
    }

    //verificar se já existe avaliação para este serviço
    const avaliacaoExistente = await avaliacaoDAO.selectAvaliacaoByServico(id_servico);
    if (avaliacaoExistente) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'Este serviço já foi avaliado' 
      });
    }

    //criar avaliação
    const novaAvaliacao = await avaliacaoDAO.insertAvaliacao({
      id_servico,
      id_contratante: servico.id_contratante,
      id_prestador: servico.id_prestador,
      nota,
      comentario: comentario || null
    });

    res.status(201).json({ 
      status_code: 201, 
      message: 'Serviço avaliado com sucesso!',
      data: novaAvaliacao
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    });
  }
};

/**
 * buscar avaliações de um prestador
 */
const buscarAvaliacoesPrestador = async (req, res) => {
  try {
    const { id_prestador } = req.params;

    if (!id_prestador) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'ID do prestador é obrigatório' 
      });
    }

    const avaliacoes = await avaliacaoDAO.selectAvaliacoesByPrestador(Number(id_prestador));
    const media = await avaliacaoDAO.selectMediaAvaliacoesByPrestador(Number(id_prestador));

    res.status(200).json({ 
      status_code: 200, 
      data: {
        avaliacoes: avaliacoes || [],
        estatisticas: media
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    });
  }
};

/**
 *buscar avaliação de um serviço específico
 */
const buscarAvaliacaoServico = async (req, res) => {
  try {
    const { id_servico } = req.params;

    if (!id_servico) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'ID do serviço é obrigatório' 
      });
    }

    const avaliacao = await avaliacaoDAO.selectAvaliacaoByServico(Number(id_servico));

    if (!avaliacao) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Nenhuma avaliação encontrada para este serviço' 
      });
    }

    res.status(200).json({ 
      status_code: 200, 
      data: avaliacao
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status_code: 500, 
      message: 'Erro interno do servidor' 
    });
  }
};

module.exports = {
  avaliarServico,
  buscarAvaliacoesPrestador,
  buscarAvaliacaoServico
};