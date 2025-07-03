import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import type { LoginRequest, RegisterRequest, User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthResponse {
    user: Omit<User, 'passwordHash'>;
    token: string;
}

export interface JWTPayload {
    userId: number;
    username: string;
    iat?: number;
    exp?: number;
}

export class AuthService {
    async register(data: RegisterRequest): Promise<AuthResponse> {
        // Check if user already exists
        const existingUserByUsername = await storage.getUserByUsername(data.username);
        if (existingUserByUsername) {
            throw new Error('Username already exists');
        }

        const existingUserByEmail = await storage.getUserByEmail(data.email);
        if (existingUserByEmail) {
            throw new Error('Email already exists');
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(data.password, saltRounds);

        // Create user
        const user = await storage.createUser({
            username: data.username,
            email: data.email,
            passwordHash,
        });

        // Generate JWT token
        const token = this.generateToken({
            userId: user.id,
            username: user.username,
        });

        // Return user without password hash
        const { passwordHash: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token,
        };
    }

    async login(data: LoginRequest): Promise<AuthResponse> {
        // Find user by username
        const user = await storage.getUserByUsername(data.username);
        if (!user) {
            throw new Error('Invalid username or password');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Invalid username or password');
        }

        // Generate JWT token
        const token = this.generateToken({
            userId: user.id,
            username: user.username,
        });

        // Return user without password hash
        const { passwordHash: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token,
        };
    }

    async validateToken(token: string): Promise<JWTPayload> {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    async getCurrentUser(token: string): Promise<Omit<User, 'passwordHash'> | null> {
        try {
            const decoded = await this.validateToken(token);
            const user = await storage.getUserById(decoded.userId);

            if (!user) {
                return null;
            }

            const { passwordHash: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            return null;
        }
    }

    private generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    async refreshToken(token: string): Promise<string> {
        const decoded = await this.validateToken(token);

        // Generate new token with fresh expiration
        return this.generateToken({
            userId: decoded.userId,
            username: decoded.username,
        });
    }
}

export const authService = new AuthService();