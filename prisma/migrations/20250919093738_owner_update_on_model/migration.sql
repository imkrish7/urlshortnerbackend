/*
  Warnings:

  - Added the required column `ownerEmail` to the `ShortenURL` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secret` to the `ShortenURL` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ShortenURL" ADD COLUMN     "ownerEmail" TEXT NOT NULL,
ADD COLUMN     "secret" TEXT NOT NULL;
