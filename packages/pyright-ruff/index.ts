/* eslint @typescript-eslint/naming-convention: 0 */
import { Diagnostic, DiagnosticAction, DiagnosticCategory } from '../pyright-internal/src/common/diagnostic';
import { Range } from '../pyright-internal/src/common/textRange';
import { CodeAction, CodeActionKind, TextEdit, uinteger } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';

interface Location {
    column: number;
    row: number;
}

interface Edit {
    content: string;
    location: Location;
    end_location: Location;
}

interface Fix {
    applicability: 'Automatic' | 'Suggested' | 'Manual' | 'Unspecified';
    edits: Edit[];
    message: string;
}

interface RuffDiagnostic {
    code: string;
    location: Location;
    endLocation: Location;
    filename: string;
    fix: Fix | null;
    message: string;
    noqa_row: number;
    url: string;
}

export interface RuffAction extends DiagnosticAction {
    action: string;
    source: 'ruff';
    code: string;
    payload: Fix;
}

// ruff uses 1-indexed columns and rows but LSP expects 0-indexed columns and rows
function convertRange(start: Location, end: Location): Range {
    return {
        start: {
            line: Math.max(start.row - 1, 0),
            character: Math.max(start.column - 1, 0),
        },
        end: {
            line: Math.max(end.row - 1, 0),
            character: Math.max(end.column - 1, 0),
        },
    };
}

function convertEdit(edit: Edit): TextEdit {
    return {
        newText: edit.content,
        range: convertRange(edit.location, edit.end_location),
    };
}

const ErrorRegex = new RegExp(/^E\d{3}$/);
function convertDiagnostic(diag: RuffDiagnostic): Diagnostic {
    const category = diag.code.match(ErrorRegex) ? DiagnosticCategory.Error : DiagnosticCategory.Warning;
    const convertedDiag = new Diagnostic(category, diag.message, convertRange(diag.location, diag.endLocation));

    if (diag.fix) {
        const action: RuffAction = {
            action: diag.fix.message,
            source: 'ruff',
            code: diag.code,
            payload: diag.fix,
        };
        convertedDiag.addAction(action);
    }

    convertedDiag.setRule(diag.code);
    return convertedDiag;
}

// see https://beta.ruff.rs/docs/rules/ for more info
const RUFF_CODES = ['E', 'W', 'F', 'I', 'RUF', 'B', 'C4', 'ARG', 'SIM'];
function _runRuff(fp: string, buf: string, ...extraArgs: string[]): SpawnSyncReturns<Buffer> {
    const ruffArgs = RUFF_CODES.flatMap((code) => ['--select', code]);
    const args = [
        'check',
        '--stdin-filename',
        fp,
        ...ruffArgs,
        '--quiet',
        '--format=json',
        '--force-exclude',
        ...(extraArgs ?? []),
        '-',
    ];
    return spawnSync(`ruff`, args, {
        input: buf,
    });
}

export function getRuffDiagnosticsFromBuffer(fp: string, buf: string): Diagnostic[] {
    const outBuf = _runRuff(fp, buf);
    if (outBuf.error) {
        console.error(`Error running ruff: ${outBuf.stderr}`);
        return [];
    }

    const stdout = outBuf.stdout.toString();
    const diags = JSON.parse(stdout) as RuffDiagnostic[];
    return diags.map(convertDiagnostic);
}

function ruffFix(fp: string, buf: string): string {
    const outBuf = _runRuff(fp, buf, '--fix-only');
    if (outBuf.error) {
        console.error(`Error running ruff: ${outBuf.stderr}`);
        return buf; // do nothing if we fail
    }

    const newBuf = outBuf.stdout.toString();
    return newBuf;
}

const ImportSortRegex = new RegExp(/^I\d{3}$/);
export function getCodeActions(fp: string, buf: string | null, diags: Diagnostic[]): CodeAction[] {
    const docUri = URI.file(fp).toString();
    const constructChanges = (edits: TextEdit[]): Record<string, TextEdit[]> => {
        const changes: Record<string, TextEdit[]> = {};
        changes[docUri] = edits;
        return changes;
    };

    const actions = diags
        .filter((diag) => {
            const actions = (diag.getActions() ?? []) as RuffAction[];
            const ruffActions = actions.filter((a) => a.source === 'ruff');
            return ruffActions.length > 0;
        })
        .map((diag) => {
            const action = diag.getActions()![0] as RuffAction;
            const message = action.action;
            const fix = action.payload;
            const changes = constructChanges(fix.edits.map(convertEdit));
            const kind = action.code.match(ImportSortRegex)
                ? CodeActionKind.SourceOrganizeImports
                : CodeActionKind.QuickFix;
            return CodeAction.create(message, { changes }, kind);
        });

    // fix all code action, only added if we have track this file as opened (buf exists)
    if (buf) {
        const changes = constructChanges([
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
                newText: ruffFix(fp, buf),
            },
        ]);
        actions.push(
            CodeAction.create('Fix all automatically fixable errors', { changes }, CodeActionKind.SourceFixAll)
        );
    }
    return actions;
}
