# Lunari Movies

## Description

Backend part of Lunari Movies application for watching and discovering films and series made with [NestJS](https://nestjs.com/) and [GraphQL](https://graphql.org/).

Implements payments with [Stripe](https://stripe.com/), video files optimization and splitting into fragments with [ffmpeg](https://www.ffmpeg.org/), custom Dataloader solution, token-based auth (access + refresh tokens) and powerful generation system for services, args and many other.

> Frontend repository: [lunari-movie-client](https://github.com/AshedFox/lunari-movie-client)

## Tech Stack

- **[NestJS](https://nestjs.com/)** - Main framework
- **[GraphQL](https://graphql.org/)** - API Query language
- **[TypeORM](https://typeorm.io/)** - ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Database
- **[Redis](https://redis.io/)** - Caching & Message Broker
- **[BullMQ](https://docs.bullmq.io/)** - Queues
- **[JWT](https://jwt.io/)** - Authentication
- **[FFmpeg](https://ffmpeg.org/)** - Video processing
- **[Stripe](https://stripe.com/)** - Payments
- **[Google Cloud Storage](https://cloud.google.com/storage)** - File storage
- **[Docker](https://www.docker.com/)** - Containerization

## Features

- **Authentication**: Registration, authorization (access/refresh JWT), email confirmation, password reset/change.
- **Roles**: Admin, moderator, user.
- **Access Control**: CASL and guards to control access.
- **User Profile**: Base information and avatar.
- **Content Management**: CRUD for films and series (including series hierarchy `series -> season -> episode`).
- **Movies**: Access modes (public/private), age restrictions, random selection, popular movies formula (visits, reviews, bookmarks).
- **Metadata**: Genres, studios, countires, persons (various roles), images, trailers.
- **Interactions**: Reviews, ratings, watchlists (watched, bookmarked, favorite), user & system collections.
- **Co-viewing**: Rooms for watching movies together with synchronized playback.
- **Monetization**: Subscriptions and one-time purchases via Stripe.
- **Processing**: Video/audio track generation (multi-quality/language), fragment splitting, DASH manifest generation.
- **Storage**: Google Cloud Storage integration.
- **Optimization**: Powerful generation system for GraphQL args, rate limiting, throttling, optimized DataLoaders.

## Installation

### Prerequisites

- **Node.js 20+**
- **[ffmpeg](https://www.ffmpeg.org/download.html)** (for local video processing)
- **Docker** & **Docker Compose** (recommended)

### Environment Variables

Create a `.env` file in the root directory based on `.env.template`:

```bash
cp .env.template .env
```

Key configuration areas include:

- Server Port & Client URL
- Database Connection (Postgres)
- Redis Connection
- JWT Tokens (Access, Refresh, Confirmation, etc.)
- Mailing Configuration
- Google Cloud Storage Credentials
- Stripe API Keys
- Throttling Limits

### Setup using Docker (Recommended)

1. Build and start the containers:

```bash
docker-compose up -d --build
```

This will start the application, PostgreSQL, Redis, and run migrations/seed scripts.

### Setup Locally

1. Install dependencies:

```bash
npm install
```

2. Run the app:

- development

```bash
npm run start:dev
```

- production

```bash
npm run build
npm run start:prod
```

## Video Processing Flow

1. **Generation**: Create video and audio tracks of different quality/resolution from original video.

   | One language                                                                                                                     | Multiple languages                                                                                                                  |
   | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
   | <img src="https://github.com/user-attachments/assets/67488f2a-2b7d-4be6-b7fb-8d8f2135be11" alt="Single Language" height="200" /> | <img src="https://github.com/user-attachments/assets/d967b013-cc91-4dbb-a5b1-6e9c36a2836a" alt="Multiple Languages" height="200" /> |

2. **Segmentation**: Split each track into short fragments (max 4 seconds).

   <img src="https://github.com/user-attachments/assets/90ce0ae9-6d10-4bee-aadd-7375ce5c83dc" alt="Segmentation" height="200" />

3. **Manifest**: Store information about tracks and their segmentation in a DASH manifest for adaptive streaming.
