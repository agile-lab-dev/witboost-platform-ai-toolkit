.PHONY: install build test check lint format validate setup install-user install-shared clean

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

# Full validation pipeline: type-check, build the setup CLI, run the test
# suite, and dry-run every harness generator (all three scopes) to catch generation errors.
validate: check build test
	node .witboost/toolkit/setup.cjs --harness copilot --dry-run
	node .witboost/toolkit/setup.cjs --harness claude --dry-run
	node .witboost/toolkit/setup.cjs --harness codex --dry-run
	node .witboost/toolkit/setup.cjs --harness gemini --dry-run
	node .witboost/toolkit/setup.cjs --harness copilot --scope user --dry-run
	node .witboost/toolkit/setup.cjs --harness claude --scope user --dry-run
	node .witboost/toolkit/setup.cjs --harness codex --scope user --dry-run
	node .witboost/toolkit/setup.cjs --harness gemini --scope user --dry-run
	node .witboost/toolkit/setup.cjs --harness copilot --scope shared --shared-dir /tmp/witboost-validate-shared --dry-run
	node .witboost/toolkit/setup.cjs --harness claude --scope shared --shared-dir /tmp/witboost-validate-shared --dry-run
	node .witboost/toolkit/setup.cjs --harness codex --scope shared --shared-dir /tmp/witboost-validate-shared --dry-run
	node .witboost/toolkit/setup.cjs --harness gemini --scope shared --shared-dir /tmp/witboost-validate-shared --dry-run

# Regenerate harness files from the canonical .witboost/ source.
# Defaults to the harness(es) listed in .witboost/config.yml; pass
# HARNESS=<name> to target a single one, e.g. `make setup HARNESS=claude`.
setup: build
	node .witboost/toolkit/setup.cjs $(if $(HARNESS),--harness $(HARNESS),) --force

# Install agents/skills into the harness's own user-profile config (e.g.
# ~/.claude, ~/.gemini) instead of this repo, shared across every adapter repo
# you open instead of copied into each one. Pass HARNESS=<name>, e.g.
# `make install-user HARNESS=claude`. Root instructions files that already hold
# your own content (CLAUDE.md, GEMINI.md, AGENTS.md) are merged, not overwritten.
install-user: build
	node .witboost/toolkit/setup.cjs $(if $(HARNESS),--harness $(HARNESS),) --scope user --force

# Install agents/skills into a shared directory of your choice (e.g. the common
# parent folder of several sibling adapter repos) instead of this repo or your
# full home directory. Claude Code and Gemini CLI auto-load their root file
# from every directory above where you work, so this needs no further setup
# for them; Copilot and Codex need extra manual wiring (printed after running
# this). Usage: `make install-shared SHARED_DIR=~/Documents/Repos/Witboost.Mesh`.
install-shared: build
ifndef SHARED_DIR
	$(error SHARED_DIR is required, e.g. make install-shared SHARED_DIR=~/Documents/Repos/Witboost.Mesh)
endif
	node .witboost/toolkit/setup.cjs $(if $(HARNESS),--harness $(HARNESS),) --scope shared --shared-dir "$(SHARED_DIR)" --force

clean:
	rm -f .witboost/toolkit/*.cjs .witboost/toolkit/*.cjs.map

