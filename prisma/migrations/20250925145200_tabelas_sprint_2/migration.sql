-- CreateTable
CREATE TABLE `categoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `categoria_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_contratante` INTEGER NOT NULL,
    `id_prestador` INTEGER NULL,
    `id_categoria` INTEGER NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `local_entrega` VARCHAR(191) NULL,
    `status` ENUM('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `data_solicitacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_conclusao` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_servico` INTEGER NOT NULL,
    `id_contratante` INTEGER NOT NULL,
    `id_prestador` INTEGER NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `metodo` ENUM('CARTEIRA_PAGBANK', 'PIX', 'CARTAO') NOT NULL DEFAULT 'CARTEIRA_PAGBANK',
    `status` ENUM('PENDENTE', 'PAGO', 'FALHOU', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `id_pagbank` VARCHAR(191) NULL,
    `data_pagamento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carteira` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `chave_pagbank` VARCHAR(191) NOT NULL,
    `saldo` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `carteira_id_usuario_key`(`id_usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transacao_carteira` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_carteira` INTEGER NOT NULL,
    `tipo` ENUM('ENTRADA', 'SAIDA') NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `data_transacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `servico` ADD CONSTRAINT `servico_id_contratante_fkey` FOREIGN KEY (`id_contratante`) REFERENCES `Contratante`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servico` ADD CONSTRAINT `servico_id_prestador_fkey` FOREIGN KEY (`id_prestador`) REFERENCES `Prestador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servico` ADD CONSTRAINT `servico_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `categoria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamento` ADD CONSTRAINT `pagamento_id_servico_fkey` FOREIGN KEY (`id_servico`) REFERENCES `servico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamento` ADD CONSTRAINT `pagamento_id_contratante_fkey` FOREIGN KEY (`id_contratante`) REFERENCES `Contratante`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamento` ADD CONSTRAINT `pagamento_id_prestador_fkey` FOREIGN KEY (`id_prestador`) REFERENCES `Prestador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carteira` ADD CONSTRAINT `carteira_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transacao_carteira` ADD CONSTRAINT `transacao_carteira_id_carteira_fkey` FOREIGN KEY (`id_carteira`) REFERENCES `carteira`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
