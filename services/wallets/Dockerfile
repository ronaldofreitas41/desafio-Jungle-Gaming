FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
RUN bun install --no-cache


COPY . .

# Gera o client do prisma localmente
RUN bun prisma generate


RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 4002

# Usa o entrypoint que roda prisma migrate antes de iniciar o serviço
ENTRYPOINT ["./entrypoint.sh"]