import { TextEdit, uinteger } from 'vscode-languageserver';
import { writeFile, open } from "fs/promises";
import { interpreter, PyModule } from "node-calls-python";
let yapf: PyModule;
const YAPF_CONF = `[style]
indent_width: `;
const style_config = "/dev/shm/yapf.ini";
(async()=>{yapf = await interpreter.import("yapf.yapflib.yapf_api", false);
await writeFile(style_config, YAPF_CONF);})();
async function _runYapf(buf: string, indentWidth: number, useTabs: boolean): Promise<string[]> {
    const handle = await open(style_config, "a+");
    await handle.truncate(YAPF_CONF.length);
    await handle.write(`${indentWidth}`);
    if (useTabs)
        await handle.write(`
use_tabs: true`);
    return interpreter.call(yapf, "FormatCode", buf, {style_config, __kwargs: true}) as unknown as string[];
>>>>>>> 68c5e44b6 (efficient async formatting)
}
export async function formatBufferWithYapf(buf: string, indentWidth: number, useTabs: boolean): Promise<TextEdit[]> {
    const [newText, changed] = await _runYapf(buf, indentWidth, useTabs);
		const changes = [];
		if (changed)
			changes.push({
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
      })
    return changes;
}