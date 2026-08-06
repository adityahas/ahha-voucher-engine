.PHONY: dev dev-infra dev-backend dev-frontend dev-admin dev-consumer dev-all dev-down build up down logs restart ps clean seed

dev: dev-all

dev-infra:
	docker compose -f docker-compose.dev.yml up -d postgres redis

dev-backend:
	docker compose -f docker-compose.dev.yml --profile backend up

dev-frontend:
	docker compose -f docker-compose.dev.yml --profile frontend up

dev-admin:
	docker compose -f docker-compose.dev.yml --profile admin up

dev-consumer:
	docker compose -f docker-compose.dev.yml --profile consumer up

dev-all:
	docker compose -f docker-compose.dev.yml --profile all up

dev-down:
	docker compose -f docker-compose.dev.yml down

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose restart

ps:
	docker compose ps

clean:
	docker compose down -v --remove-orphans
	docker system prune -f

seed:
	docker compose exec admin node dist/apps/admin/src/seeder/main.seeder.js

build-backend:
	docker build -t ahha-backend -f Dockerfile .

build-cms:
	docker build -t ahha-cms -f Dockerfile.cms .

build-consumer:
	docker build -t ahha-consumer -f Dockerfile.consumer .

build: build-backend build-cms build-consumer

prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
