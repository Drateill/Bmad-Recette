# Backend Architecture

## Service Organization (NestJS Modules)

```
apps/api/src/
├── modules/
│   ├── auth/               # Authentication module
│   ├── recipes/            # Recipe management
│   ├── ocr/                # OCR processing
│   ├── shopping-lists/     # Shopping list generation
│   ├── menus/              # Menu generation
│   ├── sync/               # Cross-device sync
│   └── storage/            # S3 storage service
├── common/                 # Shared backend code
│   ├── filters/            # Exception filters
│   ├── interceptors/       # Logging
│   └── guards/             # Auth guards
└── prisma/                 # Prisma service
```

## Repository Pattern

All database access abstracted through repository interfaces to isolate ORM from business logic.

```typescript
@Injectable()
export class RecipesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Recipe | null>
  async findByUser(userId: string, filters: any): Promise<RecipeList>
  async create(data: RecipeCreateInput): Promise<Recipe>
  async update(id: string, data: RecipeUpdateInput): Promise<Recipe>
  async delete(id: string): Promise<void>
}
```

---
