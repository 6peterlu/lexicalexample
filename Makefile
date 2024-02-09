.PHONY: build start stop docker-prune migrate-dev format-and-migrate yarn-add
build:
	DOCKER_BUILDKIT=1 docker compose build
start:
	docker compose up -d
stop:
	docker compose down
docker-prune: ## Remove all docker files on system, including volumes
	docker system prune --all --volumes
prisma-format:  # Format prisma.schema file
	docker exec web npx prisma format
migrate-dev: ## Generate and run db migration files. ex (make migrate-dev name=user_and_notes_tables)
	docker exec -it web npx prisma migrate dev --name $(name) --schema prisma/schema.prisma
format-and-migrate: prisma-format migrate-dev
yarn-add: ## add package
	docker exec web yarn add $(package)
yarn-add-dev: ## add dev package
	docker exec web yarn add -D $(package)
codegen:
	docker exec web yarn codegen && docker exec web yarn schemagen
start-ws-only:  # only starts websocket server
	docker compose up y-ws -d
