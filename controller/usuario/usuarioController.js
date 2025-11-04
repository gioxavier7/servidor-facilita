/**
 * Controller de Usuario
 * Fluxo:
 *  - Cadastro básico
 *  - Login
 *  - Listagem / CRUD
 */

const usuarioDAO = require('../../model/dao/usuario')
const contratanteDAO = require('../../model/dao/contratante')
const prestadorDAO = require('../../model/dao/prestador')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()
const { enviarEmail, buildOtpHtml } = require('../../utils/email')
const { enviarSMS } = require('../../utils/sms')

// ================= CADASTRAR USUARIO =================
const cadastrarUsuario = async (req, res) => {
  try {
    const { nome, email, telefone, senha_hash } = req.body

    // ========== VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS ==========
    if (!nome || !email || !telefone || !senha_hash) {
      return res.status(400).json({ 
        error: 'Preencha todos os campos obrigatórios: nome, email, telefone e senha.' 
      })
    }

    // ========== VALIDAÇÃO DO NOME ==========
    const nomeTrimmed = nome.trim()
    if (nomeTrimmed.length < 2 || nomeTrimmed.length > 100) {
      return res.status(400).json({ 
        error: 'Nome deve ter entre 2 e 100 caracteres.' 
      })
    }

    // valida se nome contém apenas letras e espaços
    const nomeRegex = /^[A-Za-zÀ-ÿ\s']+$/
    if (!nomeRegex.test(nomeTrimmed)) {
      return res.status(400).json({ 
        error: 'Nome deve conter apenas letras e espaços.' 
      })
    }

    // ========== VALIDAÇÃO DO EMAIL ==========
    const emailTrimmed = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido.' 
      })
    }

    if (emailTrimmed.length > 255) {
      return res.status(400).json({ 
        error: 'Email muito longo. Máximo 255 caracteres.' 
      })
    }

    // ========== VALIDAÇÃO E FORMATAÇÃO DO TELEFONE ==========
    const telefoneLimpo = telefone.replace(/\D/g, '')
    
    // console.log(`Telefone recebido: ${telefone}`)
    // console.log(`Telefone limpo: ${telefoneLimpo}`)
    // console.log(`Quantidade de dígitos: ${telefoneLimpo.length}`)

    // ========== NOVA VALIDAÇÃO PARA FORMATO INTERNACIONAL ==========
    const validarTelefoneBrasileiro = (telefoneLimpo) => {
      // formato nacional: 10 dígitos (DDD + 8) ou 11 dígitos (DDD + 9)
      if (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) {
        const telefoneRegex = /^[1-9]{2}9?[0-9]{8}$/
        return telefoneRegex.test(telefoneLimpo)
      }
      
      // formato internacional: 12 dígitos (55 + DDD + 8) ou 13 dígitos (55 + DDD + 9)
      if (telefoneLimpo.length === 12 || telefoneLimpo.length === 13) {
        const telefoneRegex = /^55[1-9]{2}9?[0-9]{8}$/
        return telefoneRegex.test(telefoneLimpo)
      }
      
      return false
    }

    if (!validarTelefoneBrasileiro(telefoneLimpo)) {
      return res.status(400).json({ 
        error: 'Número de telefone inválido. Use formato: (11) 95856-8249 ou +5511958568249' 
      })
    }

    // ========== FORMATAÇÃO PARA PADRÃO INTERNACIONAL (Twilio) ==========
    const formatarTelefoneParaInternacional = (telefoneLimpo) => {
      const apenasNumeros = telefoneLimpo.replace(/\D/g, '')
      
      //já está no formato internacional
      if (telefone.startsWith('+')) {
        return telefone
      }
      
      //formato nacional (10 ou 11 dígitos)
      if (apenasNumeros.length === 10 || apenasNumeros.length === 11) {
        const numeroSemZero = apenasNumeros.replace(/^0/, '')
        return `+55${numeroSemZero}`
      }
      
      //formato internacional sem o + (12 ou 13 dígitos)
      if (apenasNumeros.length === 12 || apenasNumeros.length === 13) {
        return `+${apenasNumeros}`
      }
      
      return telefone
    }

    const telefoneFormatado = formatarTelefoneParaInternacional(telefone)
    
    // console.log(`Telefone final formatado: ${telefoneFormatado}`)

    // ========== VALIDAÇÃO DA SENHA ==========
    const senhaTrimmed = senha_hash.trim()
    
    // Tamanho mínimo e máximo
    if (senhaTrimmed.length < 8) {
      return res.status(400).json({ 
        error: 'Senha deve ter no mínimo 8 caracteres.' 
      })
    }

    if (senhaTrimmed.length > 20) {
      return res.status(400).json({ 
        error: 'Senha deve ter no máximo 20 caracteres.' 
      })
    }

    //força da senha
    const forcaSenha = {
      temMinuscula: /[a-z]/.test(senhaTrimmed),
      temMaiuscula: /[A-Z]/.test(senhaTrimmed),
      temNumero: /[0-9]/.test(senhaTrimmed),
      temEspecial: /[!@#$%^&*()_+\-=\[\]{}':'\\|,.<>\/?]/.test(senhaTrimmed)
    }

    const criteriosAtendidos = Object.values(forcaSenha).filter(Boolean).length

    if (criteriosAtendidos < 3) {
      return res.status(400).json({
        error: 'Senha fraca. Use letras maiúsculas, minúsculas, números e caracteres especiais.',
        criterios: {
          minimo: '8 caracteres',
          recomendado: 'Letras maiúsculas, minúsculas, números e caracteres especiais'
        }
      })
    }

    //senhas comuns que vao ser rejeitadas
    const senhasFracas = [
      '12345678', 'password', 'senha123', 'admin123', 'qwertyui',
      '123456789', '11111111', '00000000', 'abcdefgh'
    ]

    if (senhasFracas.includes(senhaTrimmed.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Senha muito comum. Escolha uma senha mais segura.' 
      })
    }

    // ========== VERIFICAR SE USUÁRIO JÁ EXISTE ==========
    try {
      const usuarioExistenteEmail = await usuarioDAO.selectByEmail(emailTrimmed)
      if (usuarioExistenteEmail) {
        return res.status(409).json({ 
          error: 'Já existe uma conta com este email.' 
        })
      }
    } catch (error) {
      if (!error.message.includes('não encontrado')) {
        throw error
      }
    }

    try {
      //verifica pelo telefone FORMATADO (padrão internacional)
      const usuarioExistenteTelefone = await usuarioDAO.selectByTelefone(telefoneFormatado)
      if (usuarioExistenteTelefone) {
        return res.status(409).json({ 
          error: 'Já existe uma conta com este telefone.' 
        })
      }
    } catch (error) {
      if (!error.message.includes('não encontrado')) {
        throw error
      }
    }

    // ========== CRIPTOGRAFAR SENHA ==========
    const senhaCriptografada = await bcrypt.hash(senhaTrimmed, 12)

    // ========== CRIAR USUÁRIO ==========
    const usuario = await usuarioDAO.insertUsuario({
      nome: nomeTrimmed,
      email: emailTrimmed,
      telefone: telefoneFormatado,
      senha_hash: senhaCriptografada,
      tipo_conta: null,
    })

    if (!usuario) {
      return res.status(500).json({ 
        error: 'Erro ao cadastrar usuário. Tente novamente.' 
      })
    }

    // ========== GERAR TOKEN JWT ==========
    const token = jwt.sign(
      { 
        id: usuario.id, 
        tipo_conta: usuario.tipo_conta, 
        email: usuario.email 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '8h',
        issuer: 'facilita-api',
        subject: usuario.id.toString()
      }
    )

    // ========== RESPOSTA DE SUCESSO ==========
    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        tipo_conta: usuario.tipo_conta,
        criado_em: usuario.criado_em
      },
      proximo_passo: 'escolher_tipo_conta',
      seguranca: {
        senha_forte: true,
        email_validado: false,
        conta_ativa: true
      }
    })

  } catch (error) {
    console.error('Erro ao cadastrar usuario:', error)
    
    //tratamento de erros especificos do prisma
    if (error.code === 'P2002') {
      const campo = error.meta?.target?.[0] || 'dados'
      return res.status(409).json({ 
        error: `Já existe uma conta com estes ${campo}.` 
      })
    }

    return res.status(500).json({ 
      error: 'Erro interno ao processar cadastro. Tente novamente.' 
    })
  }
}

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { login, senha } = req.body // email ou telefone
    console.log('Iniciando login, body recebido:', req.body)
    if (!login || !senha) {
      return res
        .status(400)
        .json({ error: 'Login (email ou telefone) e senha são obrigatórios.' })
    }

    let usuario

    if (login.includes('@')) {
      // login é email
      usuario = await usuarioDAO.selectByEmail(login)
    } else {
      // login é telefone, removendo tudo que não é número
      const telefoneLimpo = login.replace(/\D/g, '')
      usuario = await usuarioDAO.selectByTelefone(telefoneLimpo)
    }

    if (!usuario)
      return res.status(404).json({ error: 'Usuário não encontrado.' })

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)
    if (!senhaCorreta)
      return res.status(401).json({ error: 'Senha incorreta.' })

    console.log('Usuário carregado antes do sign:', usuario)
    const token = jwt.sign(
      { id: usuario.id, tipo_conta: usuario.tipo_conta, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      usuario,
      proximo_passo:
        usuario.tipo_conta === 'CONTRATANTE'
          ? 'completar_perfil_contratante'
          : 'completar_perfil_prestador',
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

// ================= GET USUÁRIO COMPLETO POR TOKEN =================
const buscarUsuarioCompleto = async (req, res) => {
  try {
    // O ID vem do middleware de autenticação JWT
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ 
        status_code: 400, 
        message: 'Token inválido ou usuário não autenticado' 
      });
    }

    // Busca usuário com todos os dados relacionados
    const usuario = await usuarioDAO.buscarUsuarioCompletoPorId(userId);

    if (!usuario) {
      return res.status(404).json({ 
        status_code: 404, 
        message: 'Usuário não encontrado' 
      });
    }

    // Estrutura base do usuário
    const usuarioFormatado = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      foto_perfil: usuario.foto_perfil,
      tipo_conta: usuario.tipo_conta,
      criado_em: usuario.criado_em,
      carteira: usuario.carteira ? {
        id: usuario.carteira.id,
        saldo: usuario.carteira.saldo,
        chave_pagbank: usuario.carteira.chave_pagbank,
        data_criacao: usuario.carteira.data_criacao
      } : null
    };

    // Adiciona dados específicos baseado no tipo de conta
    if (usuario.tipo_conta === 'CONTRATANTE' && usuario.contratante) {
      usuarioFormatado.dados_contratante = {
        id: usuario.contratante.id,
        cpf: usuario.contratante.cpf,
        necessidade: usuario.contratante.necessidade, // Agora é um campo direto
        localizacao: usuario.contratante.localizacao ? {
          id: usuario.contratante.localizacao.id,
          logradouro: usuario.contratante.localizacao.logradouro,
          numero: usuario.contratante.localizacao.numero,
          bairro: usuario.contratante.localizacao.bairro,
          cidade: usuario.contratante.localizacao.cidade,
          cep: usuario.contratante.localizacao.cep,
          latitude: usuario.contratante.localizacao.latitude,
          longitude: usuario.contratante.localizacao.longitude
        } : null
      };
    }

    if (usuario.tipo_conta === 'PRESTADOR' && usuario.prestador) {
      usuarioFormatado.dados_prestador = {
        id: usuario.prestador.id,
        documentos: usuario.prestador.documento.map(doc => ({
          id: doc.id,
          tipo_documento: doc.tipo_documento,
          valor: doc.valor,
          data_validade: doc.data_validade,
          arquivo_url: doc.arquivo_url
        })),
        cnh: usuario.prestador.cnh.map(c => ({
          id: c.id,
          numero_cnh: c.numero_cnh,
          categoria: c.categoria,
          validade: c.validade,
          possui_ear: c.possui_ear,
          pontuacao_atual: c.pontuacao_atual
        })),
        modalidades: usuario.prestador.modalidades.map(m => ({
          id: m.id,
          tipo: m.tipo
        })),
        localizacoes: usuario.prestador.localizacao.map(loc => ({
          id: loc.id,
          logradouro: loc.logradouro,
          numero: loc.numero,
          bairro: loc.bairro,
          cidade: loc.cidade,
          cep: loc.cep,
          latitude: loc.latitude,
          longitude: loc.longitude
        }))
      };
    }

    res.status(200).json({
      status_code: 200,
      data: usuarioFormatado
    });

  } catch (error) {
    console.error('Erro ao buscar usuário completo:', error);
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    });
  }
}

// ================= ATUALIZAR USUARIO =================
const atualizarPerfil = async (req, res) => {
  try {
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(415).json({ 
        status_code: 415, 
        message: 'Content-type inválido. Use application/json' 
      });
    }

    const userId = req.user.id;
    const { 
      // dados usuário
      nome, 
      email, 
      telefone, 
      senha_atual, 
      nova_senha,
      
      // dados do tipo de conta
      necessidade,
      id_localizacao,
      cpf,
      locais,
      documentos
    } = req.body;

    // busca usuário atual
    const usuarioAtual = await usuarioDAO.selectByIdUsuario(userId);
    if (!usuarioAtual) {
      return res.status(404).json({
        status_code: 404,
        message: 'Usuário não encontrado'
      });
    }

    const dadosAtualizacao = {};

    // 1. atualização de dados básicos do usuário
    if (nome) dadosAtualizacao.nome = nome;
    if (email) dadosAtualizacao.email = email;
    if (telefone) dadosAtualizacao.telefone = telefone;

    // 2. atualização de senha
    if (nova_senha) {
      if (!senha_atual) {
        return res.status(400).json({
          status_code: 400,
          message: 'Senha atual é obrigatória para alterar a senha'
        });
      }
      
      // verifica senha atual
      const senhaValida = await bcrypt.compare(senha_atual, usuarioAtual.senha_hash);
      if (!senhaValida) {
        return res.status(400).json({
          status_code: 400,
          message: 'Senha atual incorreta'
        });
      }

      // hash da nova senha
      dadosAtualizacao.senha_hash = await bcrypt.hash(nova_senha, 12);
    }

    // 3. atualização por tipo de conta
    let perfilEspecifico = null;

    if (usuarioAtual.tipo_conta === 'CONTRATANTE') {
      perfilEspecifico = await atualizarPerfilContratante(userId, {
        necessidade,
        id_localizacao,
        cpf
      });
    } else if (usuarioAtual.tipo_conta === 'PRESTADOR') {
      perfilEspecifico = await atualizarPerfilPrestador(userId, {
        locais,
        documentos
      });
    }

    // 4. atualiza dados do usuário (se houver dados para atualizar)
    let usuarioAtualizado = usuarioAtual;
    if (Object.keys(dadosAtualizacao).length > 0) {
      usuarioAtualizado = await usuarioDAO.updateUsuario(userId, dadosAtualizacao);
    }

    res.status(200).json({
      status_code: 200,
      message: 'Perfil atualizado com sucesso',
      data: {
        usuario: usuarioAtualizado,
        perfil_especifico: perfilEspecifico
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    
    if (error.message.includes('Email já existe') || error.message.includes('Telefone já existe')) {
      return res.status(400).json({
        status_code: 400,
        message: error.message
      });
    }

    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * atualizar perfil do contratante
 */
const atualizarPerfilContratante = async (userId, dados) => {
  const { necessidade, id_localizacao, cpf } = dados;
  
  const dadosContratante = {};
  if (necessidade) dadosContratante.necessidade = necessidade;
  if (id_localizacao) dadosContratante.id_localizacao = id_localizacao;
  if (cpf) dadosContratante.cpf = cpf;

  if (Object.keys(dadosContratante).length > 0) {
    return await contratanteDAO.updateContratanteByUsuarioId(userId, dadosContratante);
  }
  
  return null;
};

/**
 * atualizar perfil do prestador
 */
const atualizarPerfilPrestador = async (userId, dados) => {
  const { locais, documentos } = dados;
  
  const resultado = {};
  
  // atualizar locais do prestador
  if (locais && Array.isArray(locais)) {
    resultado.locais = await prestadorDAO.atualizarLocaisPrestador(userId, locais);
  }
  
  // atualizar documentos do prestador 
  if (documentos && Array.isArray(documentos)) { 
    resultado.documentos = await prestadorDAO.atualizarDocumentosPrestador(userId, documentos); 
  }
  
  return Object.keys(resultado).length > 0 ? resultado : null;
};

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

// ================= SOLICITAR RECUPERAÇÃO DE SENHA =================
const solicitarRecuperacaoSenha = async (req, res) => {
  try {
    const { email, telefone } = req.body;
    
    // Validação básica
    if (!email && !telefone) {
      return res.status(400).json({ 
        error: 'E-mail ou telefone é obrigatório' 
      });
    }

    let usuario = null;
    let campoBusca = '';

    // Busca usuário por email ou telefone
    if (email) {
      usuario = await usuarioDAO.selectByEmail(email);
      campoBusca = 'email';
    } else if (telefone) {
      usuario = await usuarioDAO.selectByTelefone(telefone);
      campoBusca = 'telefone';
    }

    // Se usuário não encontrado, ainda retorna 200 por segurança
    if (!usuario) {
      console.log(`Usuário não encontrado com ${campoBusca}:`, email || telefone);
      return res.json({ 
        message: 'Se seus dados estiverem cadastrados, você receberá um código em instantes.',
        sucesso: true
      });
    }

    // Gera código e salva
    const codigo = Math.floor(10000 + Math.random() * 90000).toString();
    const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    
    await usuarioDAO.criarCodigo(usuario.id, codigo, expira);

    // Envia por email (se email foi fornecido E usuário tem email)
    if (email && usuario.email) {
      try {
        await enviarEmail(usuario.email, 'Código de Recuperação - Facilita', {
          text: `Seu código de recuperação é: ${codigo} (válido por 15 minutos).`,
          html: buildOtpHtml(codigo),
        });
        console.log(`Código enviado por email para: ${usuario.email}`);
      } catch (emailError) {
        console.error('Erro no envio por email:', emailError.message);
      }
    }

    // Envia por SMS (se telefone foi fornecido E usuário tem telefone)
    if (telefone && usuario.telefone) {
      try {
        await enviarSMS(usuario.telefone, codigo);
        console.log(`Código enviado por SMS para: ${usuario.telefone}`);
      } catch (smsError) {
        console.error('Erro no envio por SMS:', smsError.message);
      }
    }

    console.log(`Código de recuperação gerado: ${codigo} para usuário: ${usuario.id}`);

    return res.json({ 
      message: 'Se seus dados estiverem cadastrados, você receberá um código em instantes.',
      sucesso: true
    });
    
  } catch (err) {
    console.error('Erro ao solicitar recuperação de senha:', err);
    return res.status(500).json({ 
      error: 'Erro ao solicitar recuperação de senha',
      sucesso: false
    });
  }
};

// ================= VERIFICAR CÓDIGO =================
const verificarCodigo = async (req, res) => {
  try {
    const { codigo } = req.body;
    
    // validação do código
    if (!codigo) {
      return res.status(400).json({ 
        error: 'Código é obrigatório',
        sucesso: false
      });
    }

    // Buscar os códigos não expirados/não usados com este código
    const registros = await usuarioDAO.buscarCodigoPorNumero(codigo);
    const agora = new Date();

    // encontrar um código válido
    const registroValido = registros.find(registro => 
      !registro.usado && new Date(registro.expira) > agora
    );

    if (!registroValido) {
      return res.status(400).json({ 
        error: 'Código inválido ou expirado',
        sucesso: false
      });
    }

    // buscar dados do usuário
    const usuario = await usuarioDAO.selectByIdUsuario(registroValido.usuarioId);
    
    if (!usuario) {
      return res.status(400).json({ 
        error: 'Código inválido',
        sucesso: false
      });
    }

    console.log(`Código validado com sucesso para usuário: ${usuario.id}`);

    return res.json({ 
      message: 'Código validado com sucesso',
      sucesso: true,
      dados: {
        usuario_id: usuario.id,
        email: usuario.email,
        telefone: usuario.telefone,
        codigo_valido: codigo
      }
    });
    
  } catch (err) {
    console.error('Erro ao verificar código:', err);
    return res.status(500).json({ 
      error: 'Erro ao verificar código',
      sucesso: false
    });
  }
};

// ================= REDEFINIR SENHA =================
const redefinirSenha = async (req, res) => {
  try {
    const { codigo, novaSenha } = req.body;
    
    // validação dos campos obrigatórios
    if (!codigo || !novaSenha) {
      return res.status(400).json({ 
        error: 'Código e nova senha são obrigatórios',
        sucesso: false
      });
    }

    // validação da senha
    if (novaSenha.length < 8) {
      return res.status(400).json({ 
        error: 'A senha deve ter pelo menos 8 caracteres',
        sucesso: false
      });
    }

    // buscar o código para encontrar o usuário
    const registros = await usuarioDAO.buscarCodigoPorNumero(codigo);
    const agora = new Date();

    const registroValido = registros.find(registro => 
      !registro.usado && new Date(registro.expira) > agora
    );

    if (!registroValido) {
      return res.status(400).json({ 
        error: 'Código inválido ou expirado',
        sucesso: false
      });
    }

    // buscar usuário
    const usuario = await usuarioDAO.selectByIdUsuario(registroValido.usuarioId);
    
    if (!usuario) {
      return res.status(400).json({ 
        error: 'Usuário não encontrado',
        sucesso: false
      });
    }

    // criptografar nova senha
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);
    
    //atualizar senha e marcar código como usado
    await usuarioDAO.updaterSenha(usuario.id, senhaCriptografada);
    await usuarioDAO.marcarComoUsado(registroValido.id);

    console.log(`Senha redefinida com sucesso para usuário: ${usuario.id}`);

    return res.json({ 
      message: 'Senha atualizada com sucesso',
      sucesso: true
    });
    
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    return res.status(500).json({ 
      error: 'Erro ao redefinir senha',
      sucesso: false
    });
  }
};

/**
 * Buscar perfil completo do usuário autenticado
 */
const buscarPerfilUsuario = async (req, res) => {
  try {
    const userId = req.user.id; // ← Pega do token, não precisa de params

    const usuario = await usuarioDAO.selectByIdUsuario(userId);
    if (!usuario) {
      return res.status(404).json({
        status_code: 404,
        message: 'Usuário não encontrado'
      });
    }

    let perfilEspecifico = null;

    // Busca dados específicos do tipo de conta
    if (usuario.tipo_conta === 'CONTRATANTE') {
      perfilEspecifico = await contratanteDAO.selectContratanteByUsuarioId(userId);
    } else if (usuario.tipo_conta === 'PRESTADOR') {
      perfilEspecifico = await prestadorDAO.selectPrestadorCompletoByUsuarioId(userId);
    }

    res.status(200).json({
      status_code: 200,
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          telefone: usuario.telefone,
          tipo_conta: usuario.tipo_conta,
          criado_em: usuario.criado_em
        },
        perfil_especifico: perfilEspecifico
      }
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      status_code: 500,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  cadastrarUsuario,
  login,
  listarUsuarios,
  deletarUsuario,
  solicitarRecuperacaoSenha,
  verificarCodigo,
  redefinirSenha,
  buscarPerfilUsuario,
  atualizarPerfil,
  buscarUsuarioCompleto
}
