-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_flights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "travelDate" DATETIME NOT NULL,
    "returnDate" DATETIME,
    "tripType" TEXT NOT NULL DEFAULT 'one-way',
    "cabinClass" TEXT NOT NULL,
    "numPassengers" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_flights" ("airline", "cabinClass", "createdAt", "destination", "id", "isActive", "numPassengers", "origin", "travelDate") SELECT "airline", "cabinClass", "createdAt", "destination", "id", "isActive", "numPassengers", "origin", "travelDate" FROM "flights";
DROP TABLE "flights";
ALTER TABLE "new_flights" RENAME TO "flights";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
