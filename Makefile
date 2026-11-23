# Slideware commands. Run `make` or `make help` to list them.

.DEFAULT_GOAL := help
NODE ?= node
PORT ?= 4321
TESTS := build/test/build.test.mjs build/test/images.test.mjs preview/test/dev.test.mjs addons/test/registry.test.mjs addons/test/cli.test.mjs

.PHONY: help build preview test test-browser check decks addons assets

help: ## Show this help
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "  Variables: SLUG=<deck>  PORT=<port, default 4321>  ADDON=<id>  ARGS='<asset command>'"

build: ## Build decks: all, or one with SLUG=<deck>
	$(NODE) build/build.mjs $(SLUG)

preview: guard-SLUG ## Live preview of SLUG while designing (Ctrl+C to stop)
	$(NODE) preview/dev.mjs $(SLUG) $(PORT)

test: ## Run the unit tests
	$(NODE) --test $(TESTS)

test-browser: ## Test offline diagrams in Chromium (requires agent-browser)
	$(NODE) --test libs/test/diagrams.browser.test.mjs

check: test build ## Run the tests, then build every deck

addons: ## List configured external add-ons and their capabilities
	$(NODE) addons/cli.mjs list

assets: ## Run a configured local asset source (ADDON=<id> when more than one, ARGS='<command>')
	$(NODE) addons/cli.mjs assets $(ADDON) -- $(ARGS)

decks: ## List decks and whether each is built
	@for d in decks/*/; do [ -f "$$d/source/slides.html" ] || continue; s=$$(basename "$$d"); if [ -f "$$d/output/$$s.html" ]; then echo "  $$s  built"; else echo "  $$s  not built"; fi; done; true

guard-%:
	@if [ -z "$($*)" ]; then echo "Set $*=<value>, e.g. make $(MAKECMDGOALS) $*=my-talk"; exit 2; fi
