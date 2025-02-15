FROM public.ecr.aws/lambda/nodejs:18

WORKDIR /var/task

COPY package.json package-lock.json ./

RUN npm install --only=production

COPY . .

ENV NODE_ENV=production

CMD ["index.handler"]
