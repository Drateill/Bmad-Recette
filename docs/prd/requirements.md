# Requirements

## Functional

**Recipe Management**

- FR1: Users shall be able to manually create recipes with structured fields: title, ingredients (quantity + unit + name), numbered preparation steps, prep/cook time, and servings
- FR2: The system shall provide auto-completion from a database of 500-1000 common ingredients during recipe creation
- FR3: Users shall be able to upload one or more photos for each recipe
- FR4: Users shall be able to scan recipes from physical sources (books, magazines) using OCR with post-scan editing capabilities
- FR5: The system shall provide 5-10 recipe templates (dessert, main course, appetizer, etc.) for rapid creation
- FR6: Users shall be able to adjust recipe portions using a multiplier (x0.5, x2, x4, custom) with automatic quantity recalculation

**Tagging & Organization**

- FR7: The system shall support 6 default tag categories: Time/Effort, Diet/Health, Dish Type, Occasion, World Cuisine, and Budget
- FR8: The system shall provide 100+ predefined tags spanning all categories
- FR9: Users shall be able to assign multiple tags to a single recipe simultaneously
- FR10: Users shall be able to create custom tags that persist in their personal tag library
- FR11: Users shall be able to rate recipes using a 1-5 star system without comments
- FR12: Users shall be able to search recipes by name, ingredients, or any combination of tags

**Shopping Lists**

- FR13: Users shall be able to select multiple recipes via checkbox interface to generate a combined shopping list
- FR14: The system shall automatically aggregate duplicate ingredients across selected recipes with intelligent unit conversion
- FR15: Users shall be able to adjust portions for each recipe before generating the shopping list
- FR16: Users shall be able to organize shopping lists by aisle/category, by recipe, or alphabetically, changeable in real-time
- FR17: Users shall be able to mark ingredients as "already in stock" to exclude them from the generated list
- FR18: Users shall be able to check off items as purchased during shopping with persistent state
- FR19: Users shall be able to share shopping lists via SMS, email, or shareable link with real-time collaboration
- FR20: The system shall provide estimated cost for shopping lists based on average ingredient prices

**Ingredient-Based Suggestions**

- FR21: Users shall be able to manually enter available ingredients via checklist or free-form search
- FR22: The system shall maintain a simple inventory of saved ingredients with quick update capability
- FR23: The system shall display recipes with 100% ingredient match (exact) and partial match (with missing ingredients listed)
- FR24: The system shall prioritize recipe results by percentage of available ingredients matched
- FR25: Users shall be able to apply filters (prep time, difficulty, diet tags) to ingredient-based suggestions
- FR26: For partial-match recipes, the system shall clearly display which ingredients need to be purchased

**Menu Generation**

- FR27: Users shall be able to generate menus for 1-14 days with 1-3 meals per day (breakfast, lunch, dinner, snack)
- FR28: The system shall automatically balance menu variety by avoiding repetition of main ingredients and alternating protein types
- FR29: Users shall be able to filter menu generation by tag constraints (e.g., "only quick recipes" or "vegetarian 3 days/week")
- FR30: Users shall be able to regenerate specific meals within a menu while keeping others fixed
- FR31: The system shall provide pre-configured menu templates (vegetarian week, batch cooking, quick meals, etc.)
- FR32: Users shall be able to save complete menus as favorites for reuse
- FR33: Users shall be able to generate a shopping list for an entire menu with one action

**User Management & Sync**

- FR34: Users shall be able to create accounts using email/password or OAuth (Google, Apple)
- FR35: The system shall provide guided onboarding in 3 steps or fewer
- FR36: The system shall synchronize all user data in real-time across web and mobile platforms
- FR37: Users shall be able to access their recipes and data offline with automatic sync upon reconnection
- FR38: Users shall be able to export their complete data as JSON for backup
- FR39: Users shall be able to import data from a backup file

## Non Functional

- NFR1: The web application shall achieve Time to Interactive (TTI) under 3 seconds on 4G connections
- NFR2: Cross-device synchronization shall complete within 2 seconds of data modification
- NFR3: OCR processing shall complete within 10 seconds for a standard A4 page
- NFR4: Menu generation shall complete within 5 seconds for a 7-day meal plan
- NFR5: The system shall support 100% offline functionality for viewing and using saved recipes
- NFR6: The mobile application shall be compatible with iOS 14+ and Android 10+
- NFR7: The web application shall be compatible with Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+
- NFR8: The system shall encrypt all data at rest and in transit using industry-standard protocols (TLS/SSL)
- NFR9: The system shall comply with RGPD/GDPR requirements including right to deletion and data export
- NFR10: The system shall provide a conflict resolution strategy ("last-write-wins") for offline sync conflicts in MVP
- NFR11: Infrastructure costs shall remain under €200/month for up to 1,000 active users
- NFR12: The system shall maintain 99.5% uptime during peak usage hours (6 PM - 9 PM local time)
