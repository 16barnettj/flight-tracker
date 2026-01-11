-- AlterTable
ALTER TABLE "price_history" ADD COLUMN "baseFare" REAL;
ALTER TABLE "price_history" ADD COLUMN "bookingLink" TEXT;
ALTER TABLE "price_history" ADD COLUMN "fees" REAL;
ALTER TABLE "price_history" ADD COLUMN "taxes" REAL;
