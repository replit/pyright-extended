![Pyright](https://github.com/microsoft/pyright/blob/main/docs/img/PyrightLarge.png)

# Setup
1. Install dependencies
    - `node` and `npm`
    - `ruff`
    - `yapf`
    - `npm run install:all`
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

# Building the Nix pkg
1. Ensure you have Nix installed
2. Make sure you've installed all the dependencies by doing `npm run install:all`
3. Enter the shell for node2nix: `nix-shell -p 'nodePackages.node2nix'`
4. In the shell, run `node2nix -l package-lock.json -d -18`
5. Finally, run `nix-build -A package`
6. The result lives in `./result/bin/langserver.index.js`

# Subpackages
## Pyright 
Pyright is a full-featured, standards-based static type checker for Python. It is designed for high performance and can be used with large Python source bases.
Refer to [the documentation](https://microsoft.github.io/pyright) for installation, configuration, and usage details.

