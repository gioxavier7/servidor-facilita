/**
 * controller para operações com paradas de serviço
 * dev: Giovanna Xavier
 * data: 23/10/2025
 */
const servicoParadasDAO = require('../../model/dao/parada')

//adicionar paradas a um serviço
const adicionarParadas = async (req, res) => {
    try {
        const { id_servico } = req.params
        const { paradas } = req.body

        if(!paradas || !Array.isArray(paradas)){
            return res.status(400).json({
                status_code: 400,
                message: 'Array de paradas é obrigatório'
            })
        }

        //validacao de paradas
        for(let i = 0; i < paradas.length; i++){
            const parada = paradas[i]
            if(!parada.lat || !parada.lng){
                return res.status(400).json({
                    status_code: 400,
                    message: `Parada ${i + 1} deve conter lat e lng`
                })
            }
        }

        //preparar dados com ordem
        const paradasComOrdem = paradas.map((parada, index) => ({
        id_servico: parseInt(id_servico),
        ordem: index,
        tipo: 'parada',
        lat: parada.lat,
        lng: parada.lng,
        descricao: parada.descricao || `Parada ${index + 1}`,
        endereco_completo: parada.endereco_completo || null,
        tempo_estimado_chegada: parada.tempo_estimado_chegada || null
      }))

      const paradasInseridas = await servicoParadasDAO.insertParadas(paradasComOrdem)

      if (!paradasInseridas) {
        return res.status(500).json({
          status_code: 500,
          message: 'Erro ao adicionar paradas ao serviço'
        })
      }

      res.status(201).json({
        status_code: 201,
        message: 'Paradas adicionadas com sucesso',
        data: paradasInseridas
      })

    } catch (error) {
        console.error('Erro em adicionarParadas:', error)
        res.status(500).json({
        status_code: 500,
        message: 'Erro interno do servidor'
      })
    }
}
//lista de paradas
const listarParadas = async (req, res) => {
    try {
        const { id_servico } = req.params
        const paradas = await servicoParadasDAO.selectParadasByServico(parseInt(id_servico))
        if (paradas === false) {
            return res.status(500).json({
                status_code: 500,
                message: 'Erro ao buscar paradas do serviço'
            })
        }
        res.status(200).json({
            status_code: 200,
            message: 'Paradas do serviço obtidas com sucesso',
            data: paradas
        })
    } catch (error) {
        console.error('Erro em listarParadas:', error)
        res.status(500).json({
            status_code: 500,
            message: 'Erro interno do servidor'
        })
    }
}

//busca uma parada específica
const buscarParada = async (req, res) => {
    try {
        const { id_parada } = req.params
        const parada = await servicoParadasDAO.selectParadaById(parseInt(id_parada))
        if(!parada){
            return res.status(404).json({
                status_code: 404,
                message: 'Parada não encontrada'
            })
        }

        res.status(200).json({
            status_code: 200,
            message: 'Parada obtida com sucesso',
            data: parada
        })
    } catch (error) {
        console.error('Erro em buscarParada:', error)
        res.status(500).json({
            status_code: 500,
            message: 'Erro interno do servidor'
        })  
    }
}

//atualizar parada
const atualizarParada = async (req, res) => {
    try {
        const { id_parada } = req.params
        const dados = req.body

        //campos que podem ser atualizados
        const camposPermitidos = ['descricao', 'endereco_completo', 'tempo_estimado_chegada']
        const dadosAtualizacao = {}
        
        for(const campo of camposPermitidos){
            if(dados[campo] !== undefined){
                dadosAtualizacao[campo] = dados[campo]
            }
        }

        //se nao tiver dados pra atualizar
        if(Object.keys(dadosAtualizacao).length === 0){
            return res.status(400).json({
                status_code: 400,
                message: 'Nenhum dado válido para atualizar'
            })
        }

        const paradaAtualizada = await servicoParadasDAO.updateParada(parseInt(id_parada), dadosAtualizacao)

        if(!paradaAtualizada){
            return res.status(500).json({
                status_code: 500,
                message: 'Erro ao atualizar parada'
            })
        }

        res.status(200).json({
            status_code: 200,
            message: 'Parada atualizada com sucesso',
            data: paradaAtualizada
        })
    } catch (error) {
        console.error('Erro em atualizarParada:', error)
        res.status(500).json({
            status_code: 500,
            message: 'Erro interno do servidor'
        })
    }
}

//atualiza o tempo estimado de chegada para uma parada
const atualizarTempoEstimado = async (req, res) => {
    try {
      const { id_parada } = req.params
      const { tempo_estimado_chegada } = req.body

      if (tempo_estimado_chegada === undefined || tempo_estimado_chegada === null) {
        return res.status(400).json({
          status_code: 400,
          message: 'tempo_estimado_chegada é obrigatório'
        })
      }

      if (typeof tempo_estimado_chegada !== 'number' || tempo_estimado_chegada < 0) {
        return res.status(400).json({
          status_code: 400,
          message: 'tempo_estimado_chegada deve ser um número positivo'
        })
      }

      const paradaAtualizada = await servicoParadasDAO.updateTempoEstimado(
        parseInt(id_parada),
        tempo_estimado_chegada
      )

      if (!paradaAtualizada) {
        return res.status(404).json({
          status_code: 404,
          message: 'Parada não encontrada ou erro na atualização'
        })
      }

      res.status(200).json({
        status_code: 200,
        message: 'Tempo estimado atualizado com sucesso',
        data: paradaAtualizada
      })

    } catch (error) {
      console.error('Erro em atualizarTempoEstimado:', error)
      res.status(500).json({
        status_code: 500,
        message: 'Erro interno do servidor'
      })
    }
}

const removerTodasParadas = async (req, res) => {
    try {
        const { id_servico } = req.params
        const resultado = await servicoParadasDAO.deleteParadasByServico(parseInt(id_servico))

        if(!resultado){
            return res.status(500).json({
                status_code: 500,
                message: 'Erro ao deletar paradas do serviço'
            })
        }

        res.status(200).json({
            status_code: 200,
            message: 'Paradas deletadas com sucesso'
        })

    } catch (error) {
        console.error('Erro em removerTodasParadas:', error)
        res.status(500).json({
            status_code: 500,
            message: 'Erro interno do servidor'
        })     
    }
}
//remove uma parada especifica
const removerParada = async (req, res) => {
    try {
        const { id_parada } = req.params
        
        //verifica se a parada existe
        const parada = await servicoParadasDAO.selectParadaById(parseInt(id_parada))

        if(!parada){
            return res.status(404).json({
                status_code: 404,
                message: 'Parada não encontrada'
            })
        }

        //1. buscar todas as paradas do serviço
        const todasParadas = await servicoParadasDAO.selectParadasByServico(parada.id_servico)
        
        //2. remover parada especifica
        const paradasFiltradas = todasParadas.filter(p => p.id !== parseInt(id_parada))

        //3. reordenar as paradas restantes
        const paradasReordenadas = paradasFiltradas.map((p, index) => ({
            ...p,
            ordem: index
        }))

        //4. deletar todas as paradas e colocar com nova ordem
        await servicoParadasDAO.deleteParadasByServico(parada.id_servico)

        if(paradasReordenadas.length > 0){
            await servicoParadasDAO.insertParadas(paradasReordenadas)
        }

        res.status(200).json({
            status_code: 200,
            message: 'Parada removida com sucesso'
        })

    } catch (error) {
        console.error('Erro em remover parada:', error)
        res.status(500).json({
            status_code: 500,
            message: 'Erro interno do servidor'
        })     
    }
}

module.exports = {
    adicionarParadas,
    listarParadas,
    buscarParada,
    atualizarParada,
    atualizarTempoEstimado,
    removerTodasParadas,
    removerParada
}