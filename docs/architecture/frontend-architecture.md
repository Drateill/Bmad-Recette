# Frontend Architecture

## Component Organization

```
apps/web/src/
├── components/
│   ├── atoms/              # Basic building blocks
│   ├── molecules/          # Simple combinations
│   ├── organisms/          # Complex components
│   └── templates/          # Page layouts
├── pages/                  # React Router pages
├── hooks/                  # Custom React hooks
├── services/               # API clients
├── stores/                 # Zustand state
└── utils/                  # Helper functions
```

## State Management Architecture

Using Zustand for lightweight, performant state management with persistence for offline support.

```typescript
// State structure example
interface RecipeState {
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  isLoading: boolean;
  error: string | null;

  fetchRecipes: (filters?: RecipeFilters) => Promise<void>;
  createRecipe: (data: CreateRecipeDto) => Promise<Recipe>;
  updateRecipe: (id: string, data: UpdateRecipeDto) => Promise<Recipe>;
}
```

## Routing Architecture

Using React Router v6 with protected routes and layout components.

**Route Organization:**
- `/login`, `/register` - Public auth routes
- `/recipes` - Recipe library (protected)
- `/recipes/:id` - Recipe detail (protected)
- `/recipes/new` - Create recipe (protected)
- `/shopping-lists` - Shopping lists (protected)
- `/menus` - Menu generator (protected)

## Frontend Services Layer (API Client)

Centralized API client with interceptors for authentication, error handling, and offline queue management.

```typescript
class APIClient {
  private client: AxiosInstance;

  // Request interceptor: Add auth token
  // Response interceptor: Handle token refresh
  // Offline detection and queue management

  get<T>(url: string, params?: any): Promise<T>
  post<T>(url: string, data?: any): Promise<T>
  put<T>(url: string, data?: any): Promise<T>
  delete<T>(url: string): Promise<T>
}
```

---
