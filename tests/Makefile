$(REPL_HOME)/.pythonlibs:
	python -m venv $(REPL_HOME)/.pythonlibs
	. $(REPL_HOME)/.pythonlibs/bin/activate; \
	cd $(REPL_HOME)/tests; \
	poetry install

test: $(REPL_HOME)/.pythonlibs
	source $(REPL_HOME)/.pythonlibs/bin/activate; \
	cd $(REPL_HOME)/tests; \
	poetry run pytest pyright_extended_tests/__init__.py
