.PHONY: install build test check lint format validate setup clean

install:
	npm install

build: install
	npm run build

test:
	npm test

check:
	npm run check

lint:
	npm run lint

# Full validation pipeline: type-check, build, test, and dry-run every harness.
validate: check build test
	node .witboost/toolkit/setup.cjs --dir /tmp/witboost-validate --harness copilot --harness claude --harness codex --harness gemini --dry-run
	node .witboost/toolkit/setup.cjs --self-host --harness copilot --harness claude --harness codex --harness gemini --dry-run

# Regenerate harness files from the canonical .witboost/ source.
# Defaults to the harness(es) listed in .witboost/config.yml; pass
# HARNESS=<name> to target a single one, e.g. `make setup HARNESS=claude`.
setup: build
	node .witboost/toolkit/setup.cjs --self-host $(if $(HARNESS),--harness $(HARNESS),) --force

clean:
	rm -f .witboost/toolkit/*.cjs .witboost/toolkit/*.cjs.map

