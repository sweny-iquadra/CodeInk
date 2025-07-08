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

- July 03, 2025. Implemented complete Simple Username/Password Authentication system:
  * Database schema with users table (username, email, password_hash, timestamps)
  * Added user_id foreign key to generated_layouts table for user associations
  * Backend authentication service with bcrypt password hashing and JWT tokens
  * Authentication middleware for protecting API routes
  * Login/register API endpoints with proper validation
  * React authentication context and hooks for state management
  * Login and register forms with validation and error handling
  * Protected routes and user profile management in header
  * Token storage in localStorage with automatic API request authentication
- July 03, 2025. Repositioned AI Design Assistant as floating chat widget "CodeGenie" in bottom-right corner:
  * Transformed full-panel chatbot into compact floating icon with click-to-expand functionality
  * Updated branding from "AI Design Assistant" to "CodeGenie" for innovative, short naming
  * Added animated chat icon with online status indicator and hover tooltip
  * Maintained all interactive features: layout generation, design feedback, framework recommendations
- July 03, 2025. Optimized code generation performance for user-friendly experience:
  * Reduced OpenAI API prompts from verbose to concise and efficient formats
  * Lowered temperature settings (0.7 → 0.1-0.3) for faster, more focused responses  
  * Added max_tokens limits (400-1000) to significantly reduce processing time
  * Shortened system prompts while maintaining functionality
  * Switched all functions to use gpt-4o-mini for maximum speed
  * Optimized all API calls: text generation, image analysis, layout improvement, design assistant chat
  * Target performance: reduce from 20+ seconds to under 5 seconds
- July 03, 2025. Implemented comprehensive cancellation functionality for code generation:
  * Added AbortController support to all API requests for proper cancellation handling
  * Enhanced LoadingModal with cancel button (X icon and "Cancel Generation" button)
  * Integrated cancellation across all generation types: text-to-code, image-to-code, and layout improvement
  * Added proper error handling for cancelled requests with user-friendly toast notifications
  * Users can now cancel any generation process by clicking the X button in the loading modal
- July 03, 2025. Fixed critical bug in CodeGenie chatbot that caused JSON parsing errors:
  * Resolved "Unterminated string in JSON" error that caused 500 server responses
  * Added robust JSON validation and error handling with fallback responses
  * Simplified system prompts to ensure valid JSON format from AI responses
  * Implemented content cleaning to remove control characters that break JSON parsing
  * CodeGenie chatbot now responds reliably in ~5-6 seconds with proper suggestions
- July 03, 2025. Enhanced user experience with comprehensive UI improvements:
  * Fixed chatbot suggestion text overflow with proper text wrapping and line breaks
  * Added live preview functionality - automatically switches to preview tab when CodeGenie generates layouts
  * Cleaned up loading modal by removing explicit time display and cancel button text
  * Users can now cancel generation only via the top-right X button for cleaner interface
  * Integrated real-time preview switching across all code generation methods (text, image, improvement, chatbot)
- July 03, 2025. Resolved critical JSON parsing errors in all code generation services:
  * Applied robust JSON validation and error handling to text-to-code, image-to-code, and layout improvement functions
  * Added content cleaning to remove control characters that break JSON parsing
  * Implemented graceful fallback responses when JSON parsing fails
  * Optimized max_tokens from 800 to 700 for faster response times while maintaining quality
  * All generation methods now handle malformed AI responses safely without throwing 500 errors
- July 03, 2025. Enhanced code generation reliability and functionality:
  * Improved AI prompts for more consistent JSON responses and increased max_tokens to 1200 for complete layouts
  * Added intelligent fallback logic that extracts HTML from partial responses or generates functional basic layouts
  * Fixed "Apply Improvements" functionality in CodeGenie chatbot with auto-switch to preview mode
  * Enhanced layout improvement prompts for better results and user experience
  * Eliminated "Generation Error" fallbacks by providing working layouts even when AI responses are malformed
- July 03, 2025. Implemented real-time improvement suggestions for enhanced user experience:
  * Added progressive auto-suggestions during layout improvements showing specific enhancements being applied
  * Created real-time feedback system with step-by-step improvement notifications (visual design → responsive → accessibility)
  * Enhanced improvement action with specific suggestions for each improvement phase
  * Implemented 8-second progressive update sequence with completion confirmation and follow-up suggestions
  * Users now see detailed real-time feedback when clicking "Apply Improvements" in CodeGenie chatbot
- July 03, 2025. Reverted chatbot live preview changes to maintain application stability:
  * Removed ChatbotPreview component and related floating window functionality
  * Restored original chatbot workflow with main preview tab switching
  * Cleaned up all chatbot preview state management and UI components
  * Ensured existing functionality remains intact without breaking changes
  * CodeGenie chatbot now uses standard preview switching as before
- July 03, 2025. Fixed critical authentication error in image upload functionality:
  * Resolved "Access token required" error when generating code from uploaded images
  * Updated image generation to use authenticated fetch with proper JWT token headers for FormData uploads
  * Fixed issue where apiRequest function was incompatible with FormData due to automatic JSON content-type setting
  * Implemented custom authenticated file upload that properly handles multipart/form-data with JWT tokens
  * All image-to-code generation functionality restored and working correctly with proper authentication
- July 03, 2025. Added comprehensive user-specific layout management with public/private visibility controls:
  * Added public/private toggle switch to input panel with visual indicators (eye icons)
  * Implemented user-specific filtering - each user sees only their own private layouts in history
  * Enhanced Gallery tab to display only public layouts from all users
  * Added visibility indicators to layout history cards showing public (green eye) or private (gray eye-off) status
  * Updated backend routes to handle isPublic parameter from both text and image generation
  * All layouts now properly enforce privacy controls with database-level separation
- July 03, 2025. Enhanced CodeGenie chatbot with public/private layout visibility controls:
  * Added public/private toggle switch to CodeGenie chatbot interface
  * Users can now control whether chatbot-generated layouts are public or private
  * Toggle displays "Public" with green eye icon or "Private" with gray eye-off icon
  * Chatbot layouts default to private for user privacy but can be toggled to public
  * Integrated visibility control seamlessly into chatbot workflow
- July 05, 2025. Implemented comprehensive Project Management Assistant feature:
  * Added extensive database schema with 7 new tables: categories, tags, teams, layout_versions, shared_layouts, layout_comments, team_members
  * Created comprehensive storage layer with 20+ new methods for project management functionality
  * Built ProjectManagement component with tabs for Organization, Version Control, Collaboration, and Search
  * Added category management with color-coded organization and layout filtering
  * Implemented tag system for layout categorization and search functionality
  * Created team collaboration features with member management and role-based permissions
  * Added layout version control with change tracking and rollback capabilities
  * Integrated layout sharing and collaboration with permission controls
  * Added comprehensive search functionality with filters for categories, tags, and date ranges
  * Added Project Management tab to main navigation as third tab alongside Create and Gallery
  * Transformed Codink from simple layout generator to comprehensive design project management platform
- July 07, 2025. Fixed all Project Management UI issues and layout problems:
  * Fixed tags database schema to include description field with proper migration
  * Resolved teams query issue - teams now display properly in Teams tab
  * Enhanced Search tab with proper layout: tags multi-select with checkboxes, date range pickers, clear filters
  * Added complete Version Control interface: layout dropdown, create version form, version history display
  * Improved search layout with proper spacing, organized grid layout, and visual enhancements
  * All Project Management features now fully functional with professional UI design
- July 08, 2025. Implemented comprehensive team collaboration with automatic layout sharing:
  * Fixed team invitation workflow with all error handling and duplicate resolution
  * Added automatic layout availability in Version Control dropdown when invitation is accepted
  * Implemented role-based permission system (viewer, editor, admin) with visual indicators
  * Team shared layouts automatically appear in "Choose layout" dropdown with permission badges
  * Permission enforcement: viewers can view only, editors can edit, admins have full access
  * Enhanced dropdown with role icons (👁️ viewer, ✏️ editor, ⚡ admin) and team name display
  * Complete team collaboration workflow from invitation to shared layout access

## User Preferences

Preferred communication style: Simple, everyday language.