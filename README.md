<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/9113740/201498864-2a900c64-d88f-4ed4-b5cf-770bcb57e1f5.png">
  <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/9113740/201498152-b171abb8-9225-487a-821c-6ff49ee48579.png">
</picture>

<div align="center"><strong>Next.js Admin Dashboard Starter Template With Shadcn-ui</strong></div>
<div align="center">Built with the Next.js 15 App Router</div>
<br />
<div align="center">
<a href="https://dub.sh/shadcn-dashboard">View Demo</a>
<span>
</div>

## Overview

This is a starter template using the following stack:

- Framework - [Next.js 15](https://nextjs.org/13)
- Language - [TypeScript](https://www.typescriptlang.org)
- Styling - [Tailwind CSS](https://tailwindcss.com)
- Components - [Shadcn-ui](https://ui.shadcn.com)
- Schema Validations - [Zod](https://zod.dev)
- State Management - [Zustand](https://zustand-demo.pmnd.rs)
- Search params state manager - [Nuqs](https://nuqs.47ng.com/)
- Auth - [Auth.js](https://authjs.dev/)
- Tables - [Tanstack Tables](https://ui.shadcn.com/docs/components/data-table)
- Forms - [React Hook Form](https://ui.shadcn.com/docs/components/form)
- Command+k interface - [kbar](https://kbar.vercel.app/)
- Linting - [ESLint](https://eslint.org)
- Pre-commit Hooks - [Husky](https://typicode.github.io/husky/)
- Formatting - [Prettier](https://prettier.io)

_If you are looking for a React admin dashboard starter, here is the [repo](https://github.com/Kiranism/react-shadcn-dashboard-starter)._

## Pages

| Pages                                                                                 | Specifications                                                                                                                                                 |
| :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Signup](https://next-shadcn-dashboard-starter.vercel.app/)                           | Authentication with **NextAuth** supports Social logins and email logins (Enter dummy email for demo).                                                         |
| [Dashboard (Overview)](https://next-shadcn-dashboard-starter.vercel.app/dashboard)    | Cards with recharts graphs for analytics.Parallel routes in the overview sections with independent loading, error handling, and isolated component rendering . |
| [Product](https://next-shadcn-dashboard-starter.vercel.app/dashboard/product)         | Tanstack tables with server side searching, filter, pagination by Nuqs which is a Type-safe search params state manager in nextjs                              |
| [Product/new](https://next-shadcn-dashboard-starter.vercel.app/dashboard/product/new) | A Product Form with shadcn form (react-hook-form + zod).                                                                                                       |
| [Profile](https://next-shadcn-dashboard-starter.vercel.app/dashboard/profile)         | Mutistep dynamic forms using react-hook-form and zod for form validation.                                                                                      |
| [Kanban Board](https://next-shadcn-dashboard-starter.vercel.app/dashboard/kanban)     | A Drag n Drop task management board with dnd-kit and zustand to persist state locally.                                                                         |
| [Not Found](https://next-shadcn-dashboard-starter.vercel.app/dashboard/notfound)      | Not Found Page Added in the root level                                                                                                                         |
| -                                                                                     | -                                                                                                                                                              |
## Feature based organization

```plaintext
src/
├── app/ # Next.js App Router directory
│ ├──favicon.ico        # Stays at root
│ ├── globals.css       # Stays at root
│ ├── [locale]/ # Locale route group (en, fr)
│ │ ├── (auth)/ # Auth route group
│ │ │ ├── (signin)/
│ │ ├── (dashboard)/ # Dashboard route group
│ │ │ ├── layout.tsx
│ │ │ ├── loading.tsx
│ │ │ └── page.tsx
│ │ └── api/ # API routes
│
├── messages/ # i18n translation files
│ ├── en.json # English translations
│ └── fr.json # French translations
│
├── components/ # Shared components
│ ├── ui/ # UI components (buttons, inputs, etc.)
│ ├── layout/ # Layout components (header, sidebar, etc.)
│ └── language-switcher.tsx # Language selection component
│
├── features/ # Feature-based modules
│ ├── feature/
│ │ ├── components/ # Feature-specific components
│ │ ├── actions/ # Server actions
│ │ ├── schemas/ # Form validation schemas
│ │ └── utils/ # Feature-specific utilities
│
├── lib/ # Core utilities and configurations
│ ├── auth/ # Auth configuration
│ ├── db/ # Database utilities
│ └── utils/ # Shared utilities
│
├── hooks/ # Custom hooks
│ └── use-debounce.ts
│
├── stores/ # Zustand stores
│ └── dashboard-store.ts
│
└── types/ # TypeScript types
  └── index.ts
```

## Internationalization

The application supports multiple languages (English and French) using `next-intl`:

### Usage in Components

```typescript
// Server Components
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('namespace');
  return <h1>{t('title')}</h1>;
}
```

### Language Switching

The language can be switched using the language selector in the navigation bar. URLs will reflect the selected language:
- English: `/en/dashboard`
- French: `/fr/dashboard`

### Translation Files

Translations are stored in `src/messages/{locale}.json`:
```json
{
  "auth": {
    "signIn": {
      "title": "GitLab Dashboard",
      "description": "Please enter your email and password"
    }
  }
}
```

### Middleware Configuration

The application uses combined middleware for authentication and internationalization:
- Protects dashboard routes
- Handles locale routing
- Maintains language preferences
- Redirects unauthenticated users


## Internationalization examples

```
// Any component
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('namespace');
  return <h1>{t('title')}</h1>;
}
```

```
// Server Component
import { useLocale } from 'next-intl';

export default function Page() {
  const locale = useLocale();
  // ...
}

// Client Component
'use client';
import { useParams } from 'next/navigation';

export default function ClientComponent() {
  const params = useParams();
  const locale = params.locale;
  // ...
}
```

## Getting Started

> [!NOTE]  
> We are using **Next 15** with **React 19**, follow these steps:

Clone the repo:

```
git clone https://github.com/Kiranism/next-shadcn-dashboard-starter.git
```

- `pnpm install` ( we have legacy-peer-deps=true added in the .npmrc) => `npm install --legacy-peer-deps`
- Create a `.env.local` file by copying the example environment file:
  `cp env.example.txt .env.local`
- Add the required environment variables to the `.env.local` file.
- `pnpm run dev` => `npm run dev`

You should now be able to access the application at http://localhost:3000.

> [!WARNING]
> After cloning or forking the repository, be cautious when pulling or syncing with the latest changes, as this may result in breaking conflicts.

## Docker Deployment

### Prerequisites
- Docker
- Docker Compose

### Production Deployment

1. Clone the repository:
```bash
git clone https://github.com/Kiranism/next-shadcn-dashboard-starter.git
```

2. Create environment files:
```bash
cp env.example.txt .env.local
```

3. Update environment variables in `.env.local` with your production values.

4. Build and run with Docker Compose:
```bash
# Build the images
docker-compose build

# Start the services in detached mode
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at `http://localhost:3000`.

### Docker Commands Reference

```bash
# Rebuild the container
docker-compose build --no-cache

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# Remove all containers and volumes
docker-compose down -v

# Scale the service (if needed)
docker-compose up -d --scale nextjs=2
```

### Container Structure
```plaintext
├── nextjs           # Main application container
│   ├── Dockerfile   # Multi-stage build configuration
│   └── .dockerignore# Files excluded from the build
```

### Environment Variables
Make sure these environment variables are properly set in your production environment:
- `AUTH_URL`
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `NEXT_PUBLIC_GITLAB_URL`
- `NEXT_PUBLIC_GITLAB_TOKEN`
- `OPENAI_API_KEY`
- `BACKEND_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Production Considerations
- Use proper secrets management
- Set up proper SSL/TLS termination
- Configure appropriate logging
- Set up monitoring and alerting
- Use container orchestration for high availability

Cheers! 🥂
