# Lunari Movies

## Description

Backend part of web-application for watching and discovering films and series made using [NestJS](https://nestjs.com/) framework and [GraphQL](https://graphql.org/).
Discover client [here](https://github.com/AshedFox/lunari-movie-client).


Implements payments with [Stripe](https://stripe.com/), video files optimization and splitting into fragments with [ffmpeg](https://www.ffmpeg.org/), custom Dataloader soultion (much more effective for many-to-many relations), token-based auth (access + refresh tokens), complicated generation system, which helps to create services, inputs, args (filters, sort params, pagination params), and parse them to correct TypeOrm query.
Builds with high-performant [SWC](https://swc.rs/).

## Preparations

If you want to use video files processing, you need to install ffmpeg library on your device from [official website](https://www.ffmpeg.org/download.html).

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Video files processing

1. Generate different audio and video lines from original video
   
  | One language  |  Multiple languages  |
  |---|---|
  | <img src="https://github.com/user-attachments/assets/67488f2a-2b7d-4be6-b7fb-8d8f2135be11" alt="drawing" style="height:400px;"/> | <img src="https://github.com/user-attachments/assets/d967b013-cc91-4dbb-a5b1-6e9c36a2836a" alt="drawing" style="height:400px;"/> |

2. Split each line into fragments
<img src="https://github.com/user-attachments/assets/90ce0ae9-6d10-4bee-aadd-7375ce5c83dc" alt="drawing" style="height:400px;"/>
