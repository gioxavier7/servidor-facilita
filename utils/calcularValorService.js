// utils/calcularValorService.js
const categoriaDAO = require('../model/dao/categoria')

class CalculoValorService {
  
  /**
   * calcula o valor total do serviço usando as categorias do banco
   */
  static async calcularValorServico(dados) {
    const { 
      id_categoria, 
      valor_adicional = 0, 
      origem_lat, 
      origem_lng, 
      destino_lat, 
      destino_lng 
    } = dados

    // 1. valor base da categoria (PEGA DO BANCO)
    const valorBase = await this.obterValorBaseCategoria(id_categoria)
    
    // 2. valor por distância 
    let valorDistancia = 0
    let distanciaKm = null
    
    if (origem_lat && origem_lng && destino_lat && destino_lng) {
      distanciaKm = this.calcularDistanciaKm(
        Number(origem_lat), Number(origem_lng), Number(destino_lat), Number(destino_lng)
      )
      valorDistancia = this.calcularValorPorDistancia(distanciaKm)
    }

    // 3. valor adicional (para necessidades especiais)
    const valorAdicional = Number(valor_adicional) || 0

    // 4. cálculo final com valor mínimo
    const valorTotal = valorBase + valorAdicional + valorDistancia
    const valorFinal = Math.max(valorTotal, 15) // minimo R$ 15

    return {
      valor_base: valorBase,
      valor_adicional: valorAdicional,
      valor_distancia: valorDistancia,
      valor_total: Number(valorFinal.toFixed(2)),
      detalhes: {
        categoria: id_categoria,
        distancia_km: distanciaKm ? Number(distanciaKm.toFixed(1)) : null,
        tarifa_por_km: 1.50,
        valor_minimo: 15.00
      }
    }
  }

  /**
   * obtém valor base DA CATEGORIA NO BANCO
   */
  static async obterValorBaseCategoria(id_categoria) {
    if (!id_categoria) return 15.00 //vlor mínimo padrão
    
    try {
      const categoria = await categoriaDAO.selectCategoriaById(id_categoria)
      
      if (categoria && categoria.preco_base) {
        const valorBanco = Number(categoria.preco_base)
        if (valorBanco > 0) {
          return valorBanco
        }
      }
      
      return this.getValorPadraoCategoria(id_categoria)
      
    } catch (error) {
      console.error('Erro ao buscar categoria:', error)
      return 15.00 // Valor mínimo de segurança
    }
  }

  /**
   * valores padrão por categoria (APENAS SE NÃO TIVER NO BANCO)
   */
  static getValorPadraoCategoria(id_categoria) {
    const valoresPadrao = {
      // ID: Valor Base (fallback
      1: 15.00,  // Farmácia
      2: 40.00,  // Acompanhamento Médico  
      3: 35.00,  // Cuidador
      4: 25.00,  // Transporte Acessível
      5: 30.00,  // Acompanhante Compras
      6: 70.00,  // Limpeza Adaptada
      7: 50.00,  // Cozinha
      8: 45.00   // Lavanderia
    }
    
    return valoresPadrao[id_categoria] || 25.00
  }

  /**
   * calcula valor por distância (VALORES SOCIAIS)
   */
  static calcularValorPorDistancia(distanciaKm) {
    try {
      const tarifaPorKm = 1.50 // R$ 1,50 por km
      
      // valor mínimo para distâncias curtas (até 3km)
      if (distanciaKm <= 3) {
        return 5.00
      }
      
      // distâncias médias (3km a 10km)
      if (distanciaKm <= 10) {
        const valor = distanciaKm * tarifaPorKm
        return Number(valor.toFixed(2))
      }
      
      // distâncias longas com limite máximo
      const valor = distanciaKm * tarifaPorKm
      return Number(Math.min(valor, 25.00).toFixed(2))
      
    } catch (error) {
      console.error('Erro ao calcular valor por distância:', error)
      return 0
    }
  }

  /**
   * calcula distância em KM entre dois pontos
   */
  static calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    try {
      if (!this.validarCoordenadas(lat1, lon1) || !this.validarCoordenadas(lat2, lon2)) {
        console.log('Coordenadas inválidas, usando distância padrão')
        return 5.0
      }

      const R = 6371
      const dLat = this.toRad(lat2 - lat1)
      const dLon = this.toRad(lon2 - lon1)
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distancia = R * c
      
      return Number(distancia.toFixed(2))
    } catch (error) {
      console.error('Erro ao calcular distância:', error)
      return 5.0
    }
  }

  static validarCoordenadas(lat, lon) {
    return !isNaN(lat) && !isNaN(lon) && 
           Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  }

  static toRad(degrees) {
    return degrees * (Math.PI/180)
  }
}

module.exports = CalculoValorService