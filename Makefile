.PHONY: install build test check lint format validate setup clean

install:
	npm ci

build:
	npm run build

test:
	npm test

check:
	npm run check

lint:
	npm run lint

format:
	npm run format

# Full validation pipeline for the CLI and distributable skills.

validate: install
	npm run lint
	npm run check
	npm run build
	npm test
	npm pack --dry-run

setup: install build
	node dist/cli.js setup --dir $(if $(DIR),$(DIR),.)

clean:
	rm -rf dist coverage
