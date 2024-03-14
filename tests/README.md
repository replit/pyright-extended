pyright-extended test suite
===

Getting started:

```shell
make clean build test
```

This will:
- Clear out `.../pyright/dist` to ensure we are testing the latest build of `pyright-extended`
- Install all the `pyright-extended` node deps
- Build `.../pyright-langserver.js`
- Set up the `.pythonlibs` virtualenv with the version of Python specified in `tests/shell.nix`
- Install deps for `pyright_extended_tests`
- Run the test suite against the previously built `.../pyright-langserver.js`
