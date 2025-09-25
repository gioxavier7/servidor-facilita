-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `senha_hash` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `tipo_conta` ENUM('CONTRATANTE', 'PRESTADOR') NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuario_email_key`(`email`),
    UNIQUE INDEX `Usuario_telefone_key`(`telefone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Localizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `logradouro` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NULL,
    `bairro` VARCHAR(191) NOT NULL,
    `cidade` VARCHAR(191) NOT NULL,
    `cep` VARCHAR(191) NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contratante` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `necessidade` ENUM('IDOSO', 'DEF_VISUAL', 'DEF_AUDITIVA', 'DEF_MOTORA', 'DEF_INTELECTUAL') NULL,
    `id_usuario` INTEGER NOT NULL,
    `id_localizacao` INTEGER NOT NULL,

    UNIQUE INDEX `Contratante_id_usuario_key`(`id_usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prestador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,

    UNIQUE INDEX `Prestador_id_usuario_key`(`id_usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Documento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo_documento` ENUM('RG', 'CPF', 'CNH_EAR', 'TIPO_VEICULO', 'MODELO_VEICULO', 'ANO_VEICULO') NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `data_validade` DATETIME(3) NULL,
    `arquivo_url` VARCHAR(191) NULL,
    `id_prestador` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_LocalizacaoToPrestador` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_LocalizacaoToPrestador_AB_unique`(`A`, `B`),
    INDEX `_LocalizacaoToPrestador_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Contratante` ADD CONSTRAINT `Contratante_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contratante` ADD CONSTRAINT `Contratante_id_localizacao_fkey` FOREIGN KEY (`id_localizacao`) REFERENCES `Localizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prestador` ADD CONSTRAINT `Prestador_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Documento` ADD CONSTRAINT `Documento_id_prestador_fkey` FOREIGN KEY (`id_prestador`) REFERENCES `Prestador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_LocalizacaoToPrestador` ADD CONSTRAINT `_LocalizacaoToPrestador_A_fkey` FOREIGN KEY (`A`) REFERENCES `Localizacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_LocalizacaoToPrestador` ADD CONSTRAINT `_LocalizacaoToPrestador_B_fkey` FOREIGN KEY (`B`) REFERENCES `Prestador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
