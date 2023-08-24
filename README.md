![Pyright](https://github.com/microsoft/pyright/blob/main/docs/img/PyrightLarge.png)

Pyright is a full-featured, standards-based static type checker for Python. It is designed for high performance and can be used with large Python source bases.
Refer to [the documentation](https://microsoft.github.io/pyright) for installation, configuration, and usage details.

`pyright-extended`, which lives in this repository, is a new Python meta-LSP that includes tools such as `pyright`, `ruff`, and `yapf`.

`pyright-extended` provides the following capabilities:
- Static analysis (through `pyright-langserver`)
- Completions (though `pyright-langserver`)
- Definitions (through `pyright-langserver`)
- Hover (through `pyright-langserver`)
- References (through `pyright-langserver`)
- Formatting (through `yapf`)
- Renaming (through `pyright-langserver`)
- Import reorganization (through `ruff`)
- Linting (through `ruff`, `pyright-langserver`)
- Types (through `pyright-langserver`)

# Building from source 
1. Install dependencies
    - `node` and `npm`
    - `ruff`
    - `yapf`
    - `npm run install:all`
2. Build the LSP: `cd ./packages/pyright && npm run build`
3. Mark file as executable: `chmod +x ./packages/pyright/langserver.index.js`
3. Start LSP in your client of choice: `./packages/pyright/langserver.index.js --stdio`

# Setup 

```bash
npm i -g @replit/pyright-extended
```

## Neovim
An example setup for the Neovim editor looks something like the following:

```lua
local lspconfig = require 'lspconfig'
local configs = require 'lspconfig.configs'
local util = require 'lspconfig.util'
if not configs["pyright-extended"] then
  configs["pyright-extended"] = {
    default_config = {
      cmd = {'pyright-langserver', '--stdio'},
      filetypes = { "python" },
      autostart = true,
      root_dir = util.root_pattern('pyproject.toml'),
      single_file_support = true,
      settings = {
        python = {
          analysis = {
            autoSearchPaths = true,
            useLibraryCodeForTypes = true
          }
        }
      }
    }
  }
end
lspconfig["pyright-extended"].setup{}
vim.lsp.set_log_level("INFO")
```
## VSCode
To use `pyright-extended` in VS Code, you must build the extension from source.

1. Install deps: `npm run install:all`
2. Build the `.vsix` file: `cd packages/vscode-pyright; npm run package`, this generates a `.vsix` file
3. In VS Code, go to extensions
4. If you have Pylance, remove it, and reload
5. If Pyright already exists, remove it, and reload
6. In extensions, select "Install from VSIX..." and pick the .vsix file from step 2
7. Make a `main.py`, start typing in code, and you should get context help

# Updating from upstream and publishing 
1. `git pull upstream main`
2. `npm run build:lsp`
3. `npm run publish:lsp` (ensure you have proper NPM permissions)
