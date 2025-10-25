# Lunari Movies

## Description

Backend part of Lunari Movies application for watching and discovering films and series made with [NestJS](https://nestjs.com/) and [GraphQL](https://graphql.org/).

Implements payments with [Stripe](https://stripe.com/), video files optimization and splitting into fragments with [ffmpeg](https://www.ffmpeg.org/), custom Dataloader soultion (much more effective for many-to-many relations), token-based auth (access + refresh tokens) and powerful generation system for services, args and many other.

> Frontend repository: [lunari-movie-client](https://github.com/AshedFox/lunari-movie-client)

## Tech Stack

- [NestJS](https://nestjs.com/)
- [GraphQL](https://graphql.org/)
- [TypeORM](https://typeorm.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [JWT](https://jwt.io/)
- [FFmpeg](https://ffmpeg.org/)
- [Stripe](https://stripe.com/)
- [Google Cloud Storage](https://cloud.google.com/storage)

## Features

- Registration, authorization (access/refresh JWT), email confirmation.
- Password reset and change.
- User role model (admin, moderator, user).
- CASL and guards to control access.
- User profile with base information and avatar.
- CRUD for films and series (including series hierarchy `series -> season -> episode`).
- Access modes (public/private) and age restrictions for movies.
- Random films and series selection.
- Most popular movies selection with special formula, taking into account visits, reviews and bookmarks (each has different weight), and also time.
- Various content metadata: genres, studios, conutries, persons with different roles, images of different types, trailers.
- Movies reviews and rating.
- Different movies watchlists (watched, bookmarked, favorite).
- Video and audio tracks generation of different quality, resolution and language with ffmpeg.
- DASH manifest generation.
- Real-time generation progress monitoring.
- System and user collections of movies, CRUD operations for them.
- Collections reviews and rating.
- Rooms for co-viewing movies with synchronization between participants.
- Room playlist and invitations management.
- Subscriptions and one-time movies purchases with Stripe.
- Images processing with Sharp.
- Google Cloud Storage integration for files storage.
- Powerful generation system for GraphQL args: generate filters, sort and pagination with special factory funcitons and custom decorators. Support generated classes caching.
- Rate limiting and throttling
- Nested queries optimization with custom optimized DataLoader implementation.
- CASL and guards to control access

## Installation

### Prerequisites

- **Node.js 18+**
- **[ffmpeg](https://www.ffmpeg.org/download.html)**

### Setup

1. Install dependencies

```bash
$ npm install
```

2. Run the app

```bash
# development
$ npm run start
```

```bash
# watch
$ npm run start:dev
```

```bash
# production
$ npm run start:prod
```

## Video processing

1. Generate video and audio track of different quality/resolution from original video
   
  | One language                                                                                                                     |  Multiple languages                                                                                                               |
  |----------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
  | <img src="https://github.com/user-attachments/assets/67488f2a-2b7d-4be6-b7fb-8d8f2135be11" alt="drawing" style="height:400px;"/> | <img src="https://github.com/user-attachments/assets/d967b013-cc91-4dbb-a5b1-6e9c36a2836a" alt="drawing" style="height:400px;"/> |

2. Split each track into short fragments (max 4 seconds)

<img src="https://github.com/user-attachments/assets/90ce0ae9-6d10-4bee-aadd-7375ce5c83dc" alt="drawing" style="height:400px;"/>

3. Store information about tracks and their segmentation in dash manifest
