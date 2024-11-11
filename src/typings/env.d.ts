declare namespace NodeJs {
  interface ProcessEnv {
    JWT_SECRET: string;
    PORT: string;
    DATABASE_URL: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_BUCKET_NAME: string;
  }
}
