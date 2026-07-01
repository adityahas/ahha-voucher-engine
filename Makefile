.PHONY: dev build up down logs restart ps clean seed

dev:
	docker compose up --build

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
