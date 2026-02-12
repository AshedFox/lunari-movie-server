import { RoleEnum } from '../utils/enums/role.enum';
import { MovieTypeEnum } from '../utils/enums/movie-type.enum';
import { AgeRestrictionEnum } from '../utils/enums/age-restriction.enum';
import { AccessModeEnum } from '../utils/enums/access-mode.enum';

import { UserEntity } from '../user/entities/user.entity';
import { PersonEntity } from '../person/entities/person.entity';
import { StudioEntity } from '../studio/entities/studio.entity';
import { MovieEntity } from '../movie/entities/movie.entity';
import { MovieReviewEntity } from '../movie-review/entities/movie-review.entity';

export type TestUser = Omit<
  UserEntity,
  | 'createdAt'
  | 'updatedAt'
  | 'purchases'
  | 'subscriptions'
  | 'rooms'
  | 'avatar'
  | 'country'
  | 'isEmailConfirmed'
>;

export type TestPerson = Pick<PersonEntity, 'id' | 'name' | 'countryId'>;

export type TestStudio = Pick<StudioEntity, 'id' | 'name'>;

export interface TestMoviePerson {
  personId: number;
  role: string;
  typeId: number;
}

export type TestMovie = Omit<
  MovieEntity,
  | 'createdAt'
  | 'updatedAt'
  | 'rating'
  | 'genres'
  | 'studios'
  | 'countries'
  | 'moviePersons'
  | 'reviews'
  | 'trailers'
  | 'visits'
  | 'stats'
  | 'genresConnection'
  | 'studiosConnection'
  | 'countriesConnection'
  | 'movieImages'
  | 'collections'
  | 'collectionsConnection'
  | 'product'
  | 'cover'
> & {
  countries: string[];
  genres: string[];
  studios: number[];
  persons: TestMoviePerson[];
  releaseDate?: Date;
  startReleaseDate?: Date;
  endReleaseDate?: Date;
};

export type TestReview = Omit<
  MovieReviewEntity,
  'createdAt' | 'updatedAt' | 'user' | 'movie'
>;

// password for everyone: "1qaz2wsx"
export const TEST_USERS: TestUser[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    email: 'user1@example.com',
    name: 'John Doe',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'US',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    email: 'user2@example.com',
    name: 'Jane Smith',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'GB',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    email: 'user3@example.com',
    name: 'Alice Johnson',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'CA',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440023',
    email: 'user4@example.com',
    name: 'Bob Brown',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'CA',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440024',
    email: 'user5@example.com',
    name: 'Charlie Davis',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'DE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440025',
    email: 'user6@example.com',
    name: 'Eve White',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'FR',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440026',
    email: 'user7@example.com',
    name: 'Frank Wilson',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'JP',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440027',
    email: 'user8@example.com',
    name: 'Grace Lee',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'CN',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440028',
    email: 'user9@example.com',
    name: 'Henry Martinez',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'US',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440029',
    email: 'a.mahn@mail.ru',
    name: 'Alex Manh',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.Admin,
    countryId: 'US',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440030',
    email: 'user10@example.com',
    name: 'Ivy Garcia',
    password:
      '$argon2id$v=19$m=12,t=3,p=1$MDh0cnF0bmludjVmMDAwMA$d+Y2ndF/pJJaGRDffbcCIw',
    role: RoleEnum.User,
    countryId: 'RU',
  },
];

export const TEST_PERSONS: TestPerson[] = [
  { id: 1, name: 'Tom Hanks', countryId: 'US' },
  { id: 2, name: 'Leonardo DiCaprio', countryId: 'US' },
  { id: 3, name: 'Meryl Streep', countryId: 'US' },
  { id: 4, name: 'Brad Pitt', countryId: 'US' },
  { id: 5, name: 'Angelina Jolie', countryId: 'US' },
  { id: 6, name: 'Johnny Depp', countryId: 'US' },
  { id: 7, name: 'Scarlett Johansson', countryId: 'US' },
  { id: 8, name: 'Robert Downey Jr.', countryId: 'US' },
  { id: 9, name: 'Alex White', countryId: 'RU' },
  { id: 10, name: 'Emma Watson', countryId: 'GB' },
];

export const TEST_STUDIOS: TestStudio[] = [
  { id: 1, name: 'Warner Bros.' },
  { id: 2, name: 'Paramount Pictures' },
  { id: 3, name: 'Universal Pictures' },
  { id: 4, name: '20th Century Fox' },
  { id: 5, name: 'Sony Pictures' },
  { id: 6, name: 'Disney' },
  { id: 7, name: 'Marvel Studios' },
  { id: 8, name: 'Lucasfilm' },
  { id: 9, name: 'DreamWorks' },
  { id: 10, name: 'Pixar' },
];

export const TEST_MEDIA_COVERS: Record<string, string> = {
  '550e8400-e29b-41d4-a716-446655440000':
    'https://storage.googleapis.com/movie-catalog-3e1f7.appspot.com/images/movies/550e8400-e29b-41d4-a716-446655440000/e82b83a0-4188-4170-a1fe-6d0a21267592', // Inception
  '550e8400-e29b-41d4-a716-446655440001':
    'https://storage.googleapis.com/movie-catalog-3e1f7.appspot.com/images/movies/550e8400-e29b-41d4-a716-446655440001/2a66f2d7-8325-4ae1-b1df-1888918ce686', // The Dark Knight
  '550e8400-e29b-41d4-a716-446655440002':
    'https://storage.googleapis.com/movie-catalog-3e1f7.appspot.com/images/movies/550e8400-e29b-41d4-a716-446655440002/68c5ae5d-ce25-4e19-a2b6-0c8217302b8a', // Interstellar
  '550e8400-e29b-41d4-a716-446655440003':
    'https://storage.googleapis.com/movie-catalog-3e1f7.appspot.com/images/movies/550e8400-e29b-41d4-a716-446655440003/32c558e1-0ba8-47a5-8864-36c358536cc1', // The Matrix
  '550e8400-e29b-41d4-a716-446655440004':
    'https://storage.googleapis.com/movie-catalog-3e1f7.appspot.com/images/movies/550e8400-e29b-41d4-a716-446655440004/27d0490b-6356-4215-9ff6-c082c0bee65d', // Gladiator
  '550e8400-e29b-41d4-a716-446655440005':
    'https://storage.googleapis.com/movie-catalog-3e1f7.appspot.com/images/movies/550e8400-e29b-41d4-a716-446655440005/28f3aeb1-8b77-4430-adf1-0f8b90a53a05', // Stranger Things
  '550e8400-e29b-41d4-a716-446655440006':
    'https://storage.googleapis.com/movie-catalog-3e1f7.appspot.com/images/movies/550e8400-e29b-41d4-a716-446655440006/ce6dbac1-4efb-436b-a77e-71a2068a5dc4', // Breaking Bad
};

export const TEST_MOVIES: TestMovie[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: MovieTypeEnum.Film,
    title: 'Inception',
    description:
      'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    releaseDate: new Date('2010-07-16'),
    ageRestriction: AgeRestrictionEnum.PG13,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['US', 'GB'],
    genres: ['Action', 'Thriller', 'Sci-Fi'],
    studios: [1],
    persons: [
      { personId: 1, role: 'Cobb', typeId: 1 },
      { personId: 2, role: 'Arthur', typeId: 1 },
      { personId: 3, role: 'Mal', typeId: 1 },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    type: MovieTypeEnum.Film,
    title: 'The Dark Knight',
    description:
      'When the menace known as the Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham.',
    releaseDate: new Date('2008-07-18'),
    ageRestriction: AgeRestrictionEnum.PG13,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['FR', 'DE'],
    genres: ['Action', 'Thriller', 'Sci-Fi'],
    studios: [2],
    persons: [
      { personId: 4, role: 'Bruce Wayne / Batman', typeId: 1 },
      { personId: 5, role: 'Joker', typeId: 1 },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    type: MovieTypeEnum.Film,
    title: 'Interstellar',
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    releaseDate: new Date('2014-11-07'),
    ageRestriction: AgeRestrictionEnum.PG13,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['JP', 'CN'],
    genres: ['Action', 'Thriller', 'Sci-Fi'],
    studios: [3],
    persons: [
      { personId: 6, role: 'Cooper', typeId: 1 },
      { personId: 7, role: 'Brand', typeId: 1 },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    type: MovieTypeEnum.Film,
    title: 'The Matrix',
    description:
      'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
    releaseDate: new Date('1999-03-31'),
    ageRestriction: AgeRestrictionEnum.R,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['US', 'CA'],
    genres: ['Action', 'Thriller', 'Sci-Fi'],
    studios: [4],
    persons: [
      { personId: 8, role: 'Neo', typeId: 1 },
      { personId: 9, role: 'Trinity', typeId: 1 },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    type: MovieTypeEnum.Film,
    title: 'Gladiator',
    description:
      'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.',
    releaseDate: new Date('2000-05-05'),
    ageRestriction: AgeRestrictionEnum.R,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['RU', 'IN'],
    genres: ['Action', 'Drama', 'Western'],
    studios: [5],
    persons: [{ personId: 10, role: 'Maximus', typeId: 1 }],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    type: MovieTypeEnum.Series,
    title: 'Stranger Things',
    description:
      'When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces in order to get him back.',
    startReleaseDate: new Date('2016-07-15'),
    endReleaseDate: new Date('2022-07-01'),
    ageRestriction: AgeRestrictionEnum.PG13,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['US', 'GB'],
    genres: ['Action', 'Mystery', 'Horror'],
    studios: [6],
    persons: [
      { personId: 1, role: 'Jim Hopper', typeId: 1 },
      { personId: 2, role: 'Eleven', typeId: 1 },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    type: MovieTypeEnum.Series,
    title: 'Breaking Bad',
    description:
      "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
    startReleaseDate: new Date('2008-01-20'),
    endReleaseDate: new Date('2013-09-29'),
    ageRestriction: AgeRestrictionEnum.R,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['FR', 'DE'],
    genres: ['Action', 'Thriller', 'Drama'],
    studios: [7],
    persons: [
      { personId: 3, role: 'Walter White', typeId: 1 },
      { personId: 4, role: 'Jesse Pinkman', typeId: 1 },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    type: MovieTypeEnum.Series,
    title: 'Game of Thrones',
    description:
      'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
    startReleaseDate: new Date('2011-04-17'),
    endReleaseDate: new Date('2019-05-19'),
    ageRestriction: AgeRestrictionEnum.R,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['JP', 'CN'],
    genres: ['Action', 'Fantasy', 'Drama'],
    studios: [8],
    persons: [
      { personId: 5, role: 'Jon Snow', typeId: 1 },
      { personId: 6, role: 'Daenerys Targaryen', typeId: 1 },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    type: MovieTypeEnum.Series,
    title: 'The Witcher',
    description:
      'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
    startReleaseDate: new Date('2019-12-20'),
    endReleaseDate: new Date('2023-07-27'),
    ageRestriction: AgeRestrictionEnum.PG13,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['US', 'CA'],
    genres: ['Action', 'Fantasy', 'Thriller'],
    studios: [9],
    persons: [
      { personId: 7, role: 'Geralt of Rivia', typeId: 1 },
      { personId: 8, role: 'Yennefer', typeId: 1 },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    type: MovieTypeEnum.Series,
    title: 'The Mandalorian',
    description:
      'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.',
    startReleaseDate: new Date('2019-11-12'),
    endReleaseDate: new Date('2023-04-19'),
    ageRestriction: AgeRestrictionEnum.PG13,
    accessMode: AccessModeEnum.PUBLIC,
    countries: ['RU', 'IN'],
    genres: ['Action', 'Fantasy', 'Sci-Fi'],
    studios: [10],
    persons: [
      { personId: 9, role: 'Din Djarin', typeId: 1 },
      { personId: 10, role: 'Grogu', typeId: 1 },
    ],
  },
];

export const TEST_REVIEWS: TestReview[] = [
  {
    id: 1,
    userId: '550e8400-e29b-41d4-a716-446655440020',
    movieId: '550e8400-e29b-41d4-a716-446655440000',
    mark: 9,
    text: 'Amazing movie! The concept of dream-sharing is mind-blowing.',
  },
  {
    id: 2,
    userId: '550e8400-e29b-41d4-a716-446655440021',
    movieId: '550e8400-e29b-41d4-a716-446655440000',
    mark: 8,
    text: 'Great acting and visuals, but the plot is a bit confusing.',
  },
  {
    id: 3,
    userId: '550e8400-e29b-41d4-a716-446655440022',
    movieId: '550e8400-e29b-41d4-a716-446655440001',
    mark: 10,
    text: "Heath Ledger's Joker is legendary!",
  },
  {
    id: 4,
    userId: '550e8400-e29b-41d4-a716-446655440023',
    movieId: '550e8400-e29b-41d4-a716-446655440001',
    mark: 9,
    text: 'One of the best superhero movies ever made.',
  },
  {
    id: 5,
    userId: '550e8400-e29b-41d4-a716-446655440024',
    movieId: '550e8400-e29b-41d4-a716-446655440002',
    mark: 9,
    text: 'A visually stunning and emotionally gripping film.',
  },
  {
    id: 6,
    userId: '550e8400-e29b-41d4-a716-446655440025',
    movieId: '550e8400-e29b-41d4-a716-446655440002',
    mark: 8,
    text: 'The science is a bit far-fetched, but the story is compelling.',
  },
  {
    id: 7,
    userId: '550e8400-e29b-41d4-a716-446655440026',
    movieId: '550e8400-e29b-41d4-a716-446655440003',
    mark: 10,
    text: 'A groundbreaking film that redefined action movies.',
  },
  {
    id: 8,
    userId: '550e8400-e29b-41d4-a716-446655440027',
    movieId: '550e8400-e29b-41d4-a716-446655440003',
    mark: 9,
    text: 'The Matrix is a classic that still holds up today.',
  },
  {
    id: 9,
    userId: '550e8400-e29b-41d4-a716-446655440028',
    movieId: '550e8400-e29b-41d4-a716-446655440004',
    mark: 9,
    text: 'Russell Crowe delivers a powerful performance.',
  },
  {
    id: 10,
    userId: '550e8400-e29b-41d4-a716-446655440029',
    movieId: '550e8400-e29b-41d4-a716-446655440004',
    mark: 8,
    text: 'A great historical epic with intense action scenes.',
  },
];
