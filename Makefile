.PHONY: build test dotreplit

node_modules:
	npm install

build: node_modules
	npm run build:lsp

clean:
	git clean -fdx $(REPL_HOME)/packages/pyright/dist

test:
	cd $(REPL_HOME)/tests; \
	nix-shell --command 'make test'

dotreplit:
	pyver=$(shell nix-shell --command "cd tests; python ./support/print_majorminor.py" ./tests/shell.nix); \
	export PYTHONPATH=$(REPL_HOME)/.pythonlibs/lib/python$$pyver/site-packages:$(PYTHONPATH); \
	node $(REPL_HOME)/packages/pyright/dist/pyright-langserver.js --stdio
