/*
  Warnings:

  - You are about to alter the column `id` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- DropIndex
DROP INDEX `User_id_key` ON `user`;

-- CreateIndex
CREATE UNIQUE INDEX `User_phone_key` ON `User`(`phone`);
