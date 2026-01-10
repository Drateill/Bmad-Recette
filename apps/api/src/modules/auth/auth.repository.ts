import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by email address (case-insensitive)
   * @param email - The user's email
   * @returns The user if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });
  }

  /**
   * Find a user by ID
   * @param id - The user's ID
   * @returns The user if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user
   * @param data - User data (email, firstName, passwordHash)
   * @returns The created user
   */
  async create(data: {
    email: string;
    firstName: string;
    passwordHash: string;
  }): Promise<User> {
    try {
      return await this.prisma.user.create({
        data,
      });
    } catch (error: any) {
      // Handle Prisma unique constraint violations
      if (error.code === 'P2002') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Find a user by OAuth provider and provider ID
   * @param provider - OAuth provider name ('google' | 'apple')
   * @param providerId - Provider's user ID
   * @returns The user if found, null otherwise
   */
  async findByOAuthProvider(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    const result = await this.prisma.user.findFirst({
      where: {
        oauthProviders: {
          some: {
            provider,
            providerId,
          },
        },
      },
      include: {
        oauthProviders: true,
      },
    });

    return result;
  }

  /**
   * Create a new user with OAuth provider in a transaction
   * @param userData - User data (email, firstName, passwordHash)
   * @param oauthData - OAuth provider data
   * @returns The created user
   */
  async createWithOAuth(
    userData: {
      email: string;
      firstName: string;
      passwordHash: string | null;
    },
    oauthData: {
      provider: string;
      providerId: string;
      email: string;
    },
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...userData,
        oauthProviders: {
          create: oauthData,
        },
      },
      include: {
        oauthProviders: true,
      },
    });
  }

  /**
   * Link an OAuth provider to an existing user
   * @param userId - User ID to link provider to
   * @param oauthData - OAuth provider data
   */
  async linkOAuthProvider(
    userId: string,
    oauthData: {
      provider: string;
      providerId: string;
      email: string;
    },
  ): Promise<void> {
    await this.prisma.oAuthProvider.create({
      data: {
        userId,
        ...oauthData,
      },
    });
  }
}
