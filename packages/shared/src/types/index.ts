export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
