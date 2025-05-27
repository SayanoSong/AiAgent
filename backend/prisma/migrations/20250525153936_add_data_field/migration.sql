/*
  Warnings:

  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `User_phone_key` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    ADD COLUMN `data` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_id_key` ON `User`(`id`);
