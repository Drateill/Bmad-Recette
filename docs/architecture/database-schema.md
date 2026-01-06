# Database Schema

Transforming the conceptual data models into a concrete PostgreSQL schema with Prisma.

```prisma
// Prisma Schema for BMad Recette
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User & Authentication
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  firstName       String
  passwordHash    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastSyncedAt    DateTime  @default(now())

  oauthProviders  OAuthProvider[]
  recipes         Recipe[]
  shoppingLists   ShoppingList[]
  menus           Menu[]
  inventory       InventoryItem[]
  customTags      Tag[]

  @@index([email])
  @@map("users")
}

model Recipe {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String?
  prepTime    Int
  cookTime    Int
  servings    Int
  rating      Int?
  source      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  version     Int      @default(1)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ingredients RecipeIngredient[]
  steps       RecipeStep[]
  photos      RecipePhoto[]
  tags        RecipeTag[]

  @@index([userId])
  @@index([title])
  @@map("recipes")
}

model Ingredient {
  id           String   @id @default(uuid())
  name         String   @unique
  category     String
  commonUnits  String[]
  averagePrice Float?
  priceUnit    String?
  createdAt    DateTime @default(now())

  recipeIngredients RecipeIngredient[]
  inventoryItems    InventoryItem[]

  @@index([name])
  @@map("ingredients")
}

model ShoppingList {
  id         String   @id @default(uuid())
  userId     String
  name       String
  recipeIds  String[]
  shareToken String?  @unique
  sharedVia  String[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items      ShoppingListItem[]

  @@index([userId])
  @@map("shopping_lists")
}

model Menu {
  id         String   @id @default(uuid())
  userId     String
  name       String
  startDate  DateTime @db.Date
  days       Int
  isFavorite Boolean  @default(false)
  templateId String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  meals      MenuMeal[]

  @@index([userId])
  @@map("menus")
}
```

---
