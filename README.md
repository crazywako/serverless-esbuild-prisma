# Serverless (Esbuild) Prisma

This will help you embed Prisma into your Serverless project. 
It will copy for example schema.prisma and libquery_engine* to the Serverless function .zip files.

This might also work without esbuild.

Big thanks to @danieluhm2004 for the inspiration.

## How to use?

First, install the package by entering the following command.

```sh
npm install serverless-esbuild-prisma --save-dev
```

Add the corresponding plugin under the Serverless config file as shown below.

```yaml
plugins:
  - serverless-esbuild
  - serverless-esbuild-prisma
```

This plugin also has some additional configs:

```yaml
custom:
  prisma:
    prismaPath: ../../ # Passing this param, plugin will change the directory to find the dir prisma containing the prisma/prisma.schema
    ignoreFunctions: # Passing this param, we tell plugin which functions should be ignored and processed as non prisma based functions.
      - someNonPrismaFunction
```
