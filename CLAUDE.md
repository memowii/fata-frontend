# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Manager
This project uses **Yarn** as the package manager. Always use `yarn` instead of `npm`.

### Essential Commands
- `yarn dev` - Start development server at http://localhost:3000
- `yarn build` - Create production build
- `yarn start` - Run production server
- `yarn lint` - Run ESLint to check code quality

### Installing Dependencies
- `yarn add <package>` - Add production dependency
- `yarn add -D <package>` - Add development dependency

## Project Architecture

This is a **Next.js 15.4.5** application using the **App Router** architecture with React 19, TypeScript 5, and Tailwind CSS v4.

### Directory Structure
- `src/app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with HTML structure and font setup
  - `page.tsx` - Page components
  - `globals.css` - Global styles with Tailwind CSS directives
- `public/` - Static assets served directly

### Key Technologies
- **Framework**: Next.js 15.4.5 with App Router
- **UI**: React 19.1.0
- **Styling**: Tailwind CSS v4 with PostCSS
- **Language**: TypeScript with strict mode
- **Fonts**: Geist Sans and Geist Mono via next/font/google

### Path Aliases
TypeScript is configured with path aliases:
- `@/*` maps to `./src/*`

Example: `import Component from '@/app/components/Component'`

### Styling Approach
- Tailwind CSS v4 for utility-first styling
- CSS variables for theming (supports dark mode)
- Global styles in `src/app/globals.css`
- Use Tailwind classes directly in JSX

### Next.js App Router Conventions
- File-based routing in `src/app/`
- `layout.tsx` for shared layouts
- `page.tsx` for page components
- `loading.tsx` for loading states
- `error.tsx` for error boundaries
- Metadata API for SEO

### Component Development
When creating new components:
1. Place them in `src/app/components/`
2. Use TypeScript for type safety
3. Apply Tailwind classes for styling
4. Follow React 19 patterns (no need for React imports)