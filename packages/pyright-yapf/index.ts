import { TextEdit, uinteger } from 'vscode-languageserver';
import init, { format } from '@wasm-fmt/ruff_fmt';
(async () => {
    await init();
})();
/** @deprecated formatBuffer */
export const formatBufferWithYapf = formatBuffer;
export async function formatBuffer(buf: string, indent_width: number, useTabs: boolean): Promise<TextEdit[]> {
    const newText = format(buf, '', {
        indent_style: useTabs ? 'tab' : 'space',
        indent_width,
    });
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
            newText,
        },
    ];
}
