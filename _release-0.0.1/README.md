# GitLab Dashboard

A comprehensive dashboard for monitoring and visualizing GitLab activities, projects, and user contributions built with Next.js 14.

## Features

- Real-time activity monitoring
- Project statistics and analytics
- User contribution tracking
- Advanced search functionality
- Commit history visualization
- Project filtering and sorting
- Dark mode support

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_GITLAB_URL=your_gitlab_instance_url
NEXT_PUBLIC_GITLAB_TOKEN=your_gitlab_access_token
```

## Technical Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Axios for API calls
- date-fns for date manipulation
- Heroicons for icons

## Features

### Project Management
- View project statistics
- Track commit frequency
- Monitor language distribution
- View contributor statistics

### Activity Tracking
- Daily contribution graphs
- Commit history
- Activity timeline
- Contribution analytics

### Search
- Global search across projects
- Real-time search results
- Advanced filtering options

## Performance

- Fast page load times (<2s)
- Efficient data caching
- Optimized API calls
- Lazy loading of components

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
