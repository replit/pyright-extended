import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { TextEdit, uinteger } from 'vscode-languageserver';

function _runYapf(buf: string, indentWidth: number): SpawnSyncReturns<Buffer> {
    const args = ['--style', `{based_on_style: pep8, indent_width: ${indentWidth}}`, '--no-local-style'];
    return spawnSync(`yapf`, args, {
        input: buf,
    });
}

export function formatBufferWithYapf(buf: string, indentWidth: number): TextEdit[] {
    const outBuf = _runYapf(buf, indentWidth);
    if (outBuf.error || outBuf.stderr.length > 0) {
        console.error(`Error running yapf: ${outBuf.stderr}`);
        return [];
    }

    const outputString = outBuf.stdout.toString();
    return [
        {
            // range may seem sus but this is what the official ruff lsp actually does https://github.com/astral-sh/ruff-lsp/blob/main/ruff_lsp/server.py#L735-L740
            range: {
                start: {
                    line: 0,
                    character: 0,
                },
                end: {
                    line: uinteger.MAX_VALUE,
                    character: 0,
                },
            },
            newText: outputString,
        },
    ];
}
