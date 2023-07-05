![Pyright](https://github.com/microsoft/pyright/blob/main/docs/img/PyrightLarge.png)

# Setup
1. Install dependencies
    - `node` and `npm`
    - `ruff`
    - `yapf`
2. Build: `cd ./packages/pyright && npm run build`
3. Mark file as executable: `chmod +x ./packages/pyright/langserver.index.js`
3. Start LSP in your client of choice: `./packages/pyright/langserver.index.js --stdio`

An example setup for the Neovim editor looks something like the following:

```lua
local lspconfig = require 'lspconfig'
local configs = require 'lspconfig.configs'
local util = require 'lspconfig.util'
if not configs["pyright-extended"] then
  configs["pyright-extended"] = {
    default_config = {
      cmd = {'/Users/jzhao/projects/pyright-extended/packages/pyright/langserver.index.js', '--stdio'},
      filetypes = { "python" },
      autostart = true,
      root_dir = util.root_pattern('pyproject.toml'),
      single_file_support = true,
      settings = {
        python = {
          analysis = {
            autoSearchPaths = true,
            diagnosticMode = "workspace",
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

# Setup with VS Code

To test Pyright-extended in VS Code:

1. install deps: `npm run install:all`
2. build the `.vsix` file: `cd packages/vscode-pyright; npm run package`, this generates a `.vsix` file
3. In VS Code, go to extensions
4. If you have Pylance, remove it, and reload
5. If Pyright already exists, remove it, and reload
6. In extensions, select "Install from VSIX..." and pick the .vsix file from step 2
7. Make a `main.py`, start typing in code, and you should get context help

# Subpackages
## Pyright 
Pyright is a full-featured, standards-based static type checker for Python. It is designed for high performance and can be used with large Python source bases.
Refer to [the documentation](https://microsoft.github.io/pyright) for installation, configuration, and usage details.

