import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';
import type { JWTPayload } from '../services/auth';

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = await authService.validateToken(token);
        console.log("Auth middleware - decoded token:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = await authService.validateToken(token);
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
}