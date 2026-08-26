COMPOSE := docker compose --env-file .env.production -f compose.prod.yaml

.PHONY: help prod-up prod-down prod-restart prod-ps prod-logs prod-build prod-pull prod-shell prod-artisan

help:
	@echo "Production helpers (compose.prod.yaml + .env.production)"
	@echo ""
	@echo "  make prod-up        Build and start the stack"
	@echo "  make prod-down      Stop and remove containers"
	@echo "  make prod-restart   Restart all services"
	@echo "  make prod-ps        Show service status"
	@echo "  make prod-logs      Follow app logs (SERVICE=queue to change)"
	@echo "  make prod-build     Rebuild images without starting"
	@echo "  make prod-shell     Open a shell in the app container"
	@echo "  make prod-artisan   Run artisan (ARGS=\"migrate --force\")"
	@echo ""
	@echo "Or use: ./bin/prod <docker compose args>"

prod-up:
	$(COMPOSE) up -d --build

prod-down:
	$(COMPOSE) down

prod-restart:
	$(COMPOSE) restart

prod-ps:
	$(COMPOSE) ps

prod-logs:
	$(COMPOSE) logs -f $(or $(SERVICE),app)

prod-build:
	$(COMPOSE) build

prod-pull:
	$(COMPOSE) pull

prod-shell:
	$(COMPOSE) exec app sh

prod-artisan:
	$(COMPOSE) exec app php artisan $(ARGS)
