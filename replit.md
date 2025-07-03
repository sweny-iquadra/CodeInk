# Codink - AI-Powered UI Code Generator

## Overview

Codink is a full-stack web application that uses AI to generate responsive HTML layouts with Tailwind CSS from user descriptions or uploaded images. The application features a modern React frontend with shadcn/ui components and an Express.js backend integrated with OpenAI's GPT-4o model for code generation.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React with TypeScript, built using Vite
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4o for code generation
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for development and production
- **Routing**: Wouter for client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack Query for API state, React hooks for local state
- **File Structure**: Organized by feature with shared components

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **File Handling**: Multer for image uploads (JPEG, PNG, PDF support)
- **API Design**: RESTful endpoints with proper error handling
- **Middleware**: Custom logging, JSON parsing, CORS handling
- **Development**: Hot reloading with tsx and custom Vite integration

### Database Layer
- **ORM**: Drizzle ORM with TypeScript-first approach
- **Schema**: PostgreSQL with tables for users and generated layouts
- **Migrations**: Automated schema management via Drizzle Kit
- **Storage Abstraction**: Interface-based storage layer with in-memory fallback
- **Connection**: Neon Database serverless PostgreSQL

### AI Integration
- **Model**: OpenAI GPT-4o for advanced code generation capabilities
- **Features**: 
  - Text-to-code generation from descriptions
  - Image analysis and code generation from mockups/wireframes
  - Code explanation and improvement suggestions
- **Prompt Engineering**: Specialized system prompts for HTML/Tailwind generation
- **Response Format**: Structured JSON responses with validation

## Data Flow

1. **User Input**: Users can either describe their desired layout or upload an image
2. **Request Processing**: Frontend validates input and sends requests to appropriate API endpoints
3. **AI Processing**: Backend processes requests using OpenAI API with specialized prompts
4. **Code Generation**: AI generates responsive HTML with Tailwind CSS classes
5. **Storage**: Generated layouts are stored in the database with metadata
6. **Response**: Frontend receives generated code and displays it with preview capabilities
7. **History**: Recent generations are tracked and displayed for easy access

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **openai**: OpenAI API integration for code generation
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **multer**: File upload handling

### UI/UX Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date formatting utilities

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling

## Deployment Strategy

### Development Environment
- Uses Vite dev server with hot module replacement
- Custom middleware integration for API routes
- Replit-specific development tools and banners
- Environment-specific configuration loading

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single deployment artifact with both client and server code
- Environment variable configuration for database and API keys

### Database Management
- Drizzle migrations for schema changes
- Environment-based database URL configuration
- Connection pooling via Neon serverless driver

## Changelog
- July 01, 2025. Initial setup and complete implementation of Codink AI-powered UI code generator
- July 01, 2025. Successfully integrated OpenAI GPT-4o for text-to-code and image-to-code generation
- July 01, 2025. Added full feature set: file upload, live preview, code explanation, layout improvement, and history tracking
- July 01, 2025. Updated color scheme to modern purple/violet theme for professional developer tool aesthetic
- July 01, 2025. Removed wireframe tab from output panel, keeping only Code and Preview tabs for cleaner interface
- July 01, 2025. Integrated PostgreSQL database with Drizzle ORM for persistent data storage
- July 01, 2025. Replaced in-memory storage with DatabaseStorage for real-time layout history
- July 01, 2025. Removed prompt tips screenshot component for cleaner interface
- July 01, 2025. Added real-time updates to Recent Generations with auto-refresh every 5 seconds
- July 01, 2025. Fixed sample prompts dropdown to auto-close when "Use" button is clicked
- July 01, 2025. Added Gallery tab with "Recent Public Generations" feature for community layouts
- July 01, 2025. Extended database schema with isPublic field to support public/private layout sharing
- July 01, 2025. Created tab-based navigation system switching between Create and Gallery modes
- July 01, 2025. Cleaned up header navigation by removing Gallery and Docs links
- July 01, 2025. Renamed "Generator" to "AI Layout Builder" for clearer branding
- July 02, 2025. Added comprehensive authentication system with JWT tokens
- July 02, 2025. Added automatic token refresh functionality to maintain user sessions
- July 02, 2025. Created comprehensive authentication pages with modern UI design
- July 02, 2025. Updated database schema to include users table with proper relationships to layouts
- July 02, 2025. Enhanced header with user profile dropdown and logout functionality
- July 02, 2025. Associated generated layouts with authenticated users for personalized experience
- July 03, 2025. Removed all Google OAuth authentication functionality and related database fields (google_id, profile_image, provider)
- July 03, 2025. Simplified authentication system to use username/password only, removed session management and passport dependencies
- July 03, 2025. Cleaned up authentication UI by removing "Continue with Google" buttons and related functionality
- July 03, 2025. Updated database schema to make password field required and removed Google-specific columns
- July 03, 2025. Removed "Star on GitHub" button and related code from header component
- July 03, 2025. Developed comprehensive AI Design Assistant Chatbot with three key features:
  * Interactive Layout Generation: Conversational layout creation ("I need a landing page for my restaurant")
  * Real-time Design Feedback: Analysis and improvement suggestions for existing layouts
  * Framework Recommendations: AI-powered suggestions for Tailwind, Bootstrap, or Material Design
- July 03, 2025. Added floating chatbot interface with expandable UI, conversation history, and action buttons
- July 03, 2025. Integrated OpenAI GPT-4o for chatbot intelligence with specialized design assistant prompts
- July 03, 2025. Created backend API endpoints for chatbot interactions, framework recommendations, and layout analysis

## User Preferences

Preferred communication style: Simple, everyday language.