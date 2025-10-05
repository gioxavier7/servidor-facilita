/**
 * Controller de Usuario
 * Fluxo:
 *  - Cadastro básico
 *  - Login
 *  - Listagem / CRUD
 */

const usuarioDAO = require("../../model/dao/usuario");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { enviarEmail, buildOtpHtml } = require("../../utils/email");

// ================= CADASTRAR USUARIO =================
const cadastrarUsuario = async (req, res) => {
  try {
    const { nome, email, telefone, senha_hash } = req.body;

    // ========== VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS ==========
    if (!nome || !email || !telefone || !senha_hash) {
      return res.status(400).json({ 
        error: "Preencha todos os campos obrigatórios: nome, email, telefone e senha." 
      });
    }

    // ========== VALIDAÇÃO DO NOME ==========
    const nomeTrimmed = nome.trim();
    if (nomeTrimmed.length < 2 || nomeTrimmed.length > 100) {
      return res.status(400).json({ 
        error: "Nome deve ter entre 2 e 100 caracteres." 
      });
    }

    // valida se nome contém apenas letras e espaços
    const nomeRegex = /^[A-Za-zÀ-ÿ\s']+$/;
    if (!nomeRegex.test(nomeTrimmed)) {
      return res.status(400).json({ 
        error: "Nome deve conter apenas letras e espaços." 
      });
    }

    // ========== VALIDAÇÃO DO EMAIL ==========
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ 
        error: "Formato de email inválido." 
      });
    }

    if (emailTrimmed.length > 255) {
      return res.status(400).json({ 
        error: "Email muito longo. Máximo 255 caracteres." 
      });
    }

    // ========== VALIDAÇÃO DO TELEFONE ==========
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
      return res.status(400).json({ 
        error: "Telefone deve ter 10 ou 11 dígitos (com DDD)." 
      });
    }

    //verifica se é um número válido
    const telefoneRegex = /^[1-9]{2}9?[0-9]{8}$/;
    if (!telefoneRegex.test(telefoneLimpo)) {
      return res.status(400).json({ 
        error: "Número de telefone inválido." 
      });
    }

    // ========== VALIDAÇÃO DA SENHA ==========
    const senhaTrimmed = senha_hash.trim();
    
    // Tamanho mínimo e máximo
    if (senhaTrimmed.length < 8) {
      return res.status(400).json({ 
        error: "Senha deve ter no mínimo 8 caracteres." 
      });
    }

    if (senhaTrimmed.length > 20) {
      return res.status(400).json({ 
        error: "Senha deve ter no máximo 20 caracteres." 
      });
    }

    //força da senha
    const forcaSenha = {
      temMinuscula: /[a-z]/.test(senhaTrimmed),
      temMaiuscula: /[A-Z]/.test(senhaTrimmed),
      temNumero: /[0-9]/.test(senhaTrimmed),
      temEspecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senhaTrimmed)
    };

    const criteriosAtendidos = Object.values(forcaSenha).filter(Boolean).length;

    if (criteriosAtendidos < 3) {
      return res.status(400).json({
        error: "Senha fraca. Use letras maiúsculas, minúsculas, números e caracteres especiais.",
        criterios: {
          minimo: "8 caracteres",
          recomendado: "Letras maiúsculas, minúsculas, números e caracteres especiais"
        }
      });
    }

    //senhas comuns que vao ser rejeitadas
    const senhasFracas = [
      '12345678', 'password', 'senha123', 'admin123', 'qwertyui',
      '123456789', '11111111', '00000000', 'abcdefgh'
    ];

    if (senhasFracas.includes(senhaTrimmed.toLowerCase())) {
      return res.status(400).json({ 
        error: "Senha muito comum. Escolha uma senha mais segura." 
      });
    }

    // ========== VERIFICAR SE USUÁRIO JÁ EXISTE ==========
    try {
      const usuarioExistenteEmail = await usuarioDAO.selectByEmail(emailTrimmed);
      if (usuarioExistenteEmail) {
        return res.status(409).json({ 
          error: "Já existe uma conta com este email." 
        });
      }
    } catch (error) {
      if (!error.message.includes('não encontrado')) {
        throw error;
      }
    }

    try {
      const usuarioExistenteTelefone = await usuarioDAO.selectByTelefone(telefoneLimpo);
      if (usuarioExistenteTelefone) {
        return res.status(409).json({ 
          error: "Já existe uma conta com este telefone." 
        });
      }
    } catch (error) {
      if (!error.message.includes('não encontrado')) {
        throw error;
      }
    }

    // ========== CRIPTOGRAFAR SENHA ==========
    const senhaCriptografada = await bcrypt.hash(senhaTrimmed, 12);

    // ========== CRIAR USUÁRIO ==========
    const usuario = await usuarioDAO.insertUsuario({
      nome: nomeTrimmed,
      email: emailTrimmed,
      telefone: telefoneLimpo,
      senha_hash: senhaCriptografada,
      tipo_conta: null,
    });

    if (!usuario) {
      return res.status(500).json({ 
        error: "Erro ao cadastrar usuário. Tente novamente." 
      });
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
        expiresIn: "8h",
        issuer: 'facilita-api',
        subject: usuario.id.toString()
      }
    );

    // ========== RESPOSTA DE SUCESSO ==========
    return res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        tipo_conta: usuario.tipo_conta,
        criado_em: usuario.criado_em
      },
      proximo_passo: "escolher_tipo_conta",
      seguranca: {
        senha_forte: true,
        email_validado: false,
        conta_ativa: true
      }
    });

  } catch (error) {
    console.error("Erro ao cadastrar usuario:", error);
    
    //tratamento de erros especificos do prisma
    if (error.code === 'P2002') {
      const campo = error.meta?.target?.[0] || 'dados';
      return res.status(409).json({ 
        error: `Já existe uma conta com estes ${campo}.` 
      });
    }

    return res.status(500).json({ 
      error: "Erro interno ao processar cadastro. Tente novamente." 
    });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { login, senha } = req.body; // email ou telefone
    console.log("Iniciando login, body recebido:", req.body);
    if (!login || !senha) {
      return res
        .status(400)
        .json({ error: "Login (email ou telefone) e senha são obrigatórios." });
    }

    let usuario;

    if (login.includes("@")) {
      // login é email
      usuario = await usuarioDAO.selectByEmail(login);
    } else {
      // login é telefone, removendo tudo que não é número
      const telefoneLimpo = login.replace(/\D/g, "");
      usuario = await usuarioDAO.selectByTelefone(telefoneLimpo);
    }

    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado." });

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta)
      return res.status(401).json({ error: "Senha incorreta." });

    console.log("Usuário carregado antes do sign:", usuario);
    const token = jwt.sign(
      { id: usuario.id, tipo_conta: usuario.tipo_conta, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
      usuario,
      proximo_passo:
        usuario.tipo_conta === "CONTRATANTE"
          ? "completar_perfil_contratante"
          : "completar_perfil_prestador",
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no login." });
  }
};

// ================= LISTAR USUARIOS =================
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioDAO.selectAllUsuario();
    return res.status(200).json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuarios:", error);
    return res.status(500).json({ error: "Erro interno ao listar usuários." });
  }
};

// ================= GET USUARIO POR ID =================
const buscarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await usuarioDAO.selectByIdUsuario(parseInt(id));

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // só permite ver o próprio usuário
    if (req.usuario.id !== usuario.id) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuario:", error);
    return res.status(500).json({ error: "Erro interno ao buscar usuário." });
  }
};

// ================= ATUALIZAR USUARIO =================
const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // só permite atualizar o próprio usuário
    if (req.usuario.id !== parseInt(id)) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const data = req.body;
    if (data.senha_hash) {
      data.senha_hash = await bcrypt.hash(data.senha_hash, 10);
    }

    const usuarioAtualizado = await usuarioDAO.updateUsuario(
      parseInt(id),
      data
    );
    if (!usuarioAtualizado) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({
      message: "Usuário atualizado com sucesso!",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuario:", error);
    return res
      .status(500)
      .json({ error: "Erro interno ao atualizar usuário." });
  }
};

// ================= DELETAR USUARIO =================
const deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // só permite deletar o próprio usuário
    if (req.usuario.id !== parseInt(id)) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const deletado = await usuarioDAO.deleteUsuario(parseInt(id));
    if (!deletado) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ message: "Usuário deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar usuario:", error);
    return res.status(500).json({ error: "Erro interno ao deletar usuário." });
  }
};

// ================= ATUALIZAR PERFIL =================
const atualizarPerfil = async (req, res) => {
  try {
    const usuarioId = parseInt(req.params.id);

    // só permite atualizar o próprio usuário
    if (req.usuario.id !== usuarioId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const dados = req.body;
    if (dados.senha_hash) {
      dados.senha_hash = await bcrypt.hash(dados.senha_hash, 10);
    }

    const resultado = await usuarioDAO.updatePerfil(usuarioId, dados);

    if (resultado.error) {
      return res.status(400).json({ error: resultado.error });
    }

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ error: "Erro interno ao atualizar perfil." });
  }
};

// ================= SOLICITAR RECUPERAÇÃO DE SENHA =================
const solicitarRecuperacaoSenha = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "E-mail é obrigatório" });

    const usuario = await usuarioDAO.selectByEmail(email).catch(() => null);

    // Responde 200 para não revelar se o email existe
    if (usuario) {
      const codigo = Math.floor(10000 + Math.random() * 90000).toString();
      const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 min
      
      await usuarioDAO.criarCodigo(usuario.id, codigo, expira);

      // Envia email usando Mailgun (texto + HTML)
      await enviarEmail(email, 'Código de Recuperação - Facilita', {
        text: `Seu código de recuperação é: ${codigo} (válido por 15 minutos).\n\nSe você não solicitou esta recuperação, ignore este e-mail.`,
        html: buildOtpHtml(codigo),
      });

      console.log(`📧 Código de recuperação gerado para: ${email} - Código: ${codigo}`);
    }

    return res.json({ 
      message: "Se este e-mail estiver cadastrado, você receberá um código em instantes." 
    });
    
  } catch (err) {
    console.error("❌ Erro ao solicitar recuperação de senha:", err);
    return res.status(500).json({ 
      error: "Erro ao solicitar recuperação de senha",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ================= REDEFINIR SENHA =================
const redefinirSenha = async (req, res) => {
  try {
    const { email, codigo, novaSenha } = req.body;
    if (!email || !codigo || !novaSenha) {
      return res.status(400).json({ 
        error: "Email, código e nova senha são obrigatórios" 
      });
    }

    // Validações de senha (adicione conforme suas regras)
    if (novaSenha.length < 6) {
      return res.status(400).json({ 
        error: "A senha deve ter pelo menos 8 caracteres" 
      });
    }

    const usuario = await usuarioDAO.selectByEmail(email);
    if (!usuario) {
      return res.status(400).json({ 
        error: "Código inválido ou expirado" 
      });
    }

    const registro = await usuarioDAO.buscarCodigo(usuario.id, codigo);
    const agora = new Date();
    
    // Garante que 'registro.expira' é tratado como Date
    if (!registro || registro.usado || new Date(registro.expira) < agora) {
      return res.status(400).json({ 
        error: "Código inválido ou expirado" 
      });
    }

    // Criptografa a nova senha
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);
    
    // Atualiza a senha e marca o código como usado
    await usuarioDAO.updaterSenha(usuario.id, senhaCriptografada);
    await usuarioDAO.marcarComoUsado(registro.id);

    console.log(`✅ Senha redefinida com sucesso para: ${email}`);

    return res.json({ 
      message: "Senha atualizada com sucesso" 
    });
    
  } catch (err) {
    console.error("❌ Erro ao redefinir senha:", err);
    return res.status(500).json({ 
      error: "Erro ao redefinir senha",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  cadastrarUsuario,
  login,
  listarUsuarios,
  buscarUsuario,
  atualizarUsuario,
  deletarUsuario,
  atualizarPerfil,
  solicitarRecuperacaoSenha,
  redefinirSenha,
};
