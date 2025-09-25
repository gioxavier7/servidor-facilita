-- CreateTable
CREATE TABLE `recuperacao_senha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `codigo` VARCHAR(6) NOT NULL,
    `expira` DATETIME(3) NOT NULL,
    `usado` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recuperacao_senha` ADD CONSTRAINT `recuperacao_senha_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
