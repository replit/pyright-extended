import { Diagnostic, DiagnosticAction, DiagnosticCategory } from '../pyright-internal/src/common/diagnostic'
import { Range } from '../pyright-internal/src/common/textRange'
import { CodeAction, CodeActionKind, WorkspaceEdit, TextEdit } from 'vscode-languageserver';
import { spawnSync } from "node:child_process"

interface Location {
  column: number
  row: number
}

interface Edit {
  content: string
  location: Location
  end_location: Location
}

interface Fix {
  applicability: 'Automatic' | 'Suggested' | 'Manual' | 'Unspecified'
  edits: Edit[]
  message: string
}

interface RuffDiagnostic {
  code: string,
  location: Location
  end_location: Location
  filename: string
  fix: Fix | null,
  message: string
  noqa_row: number
  url: string
}

export interface RuffAction extends DiagnosticAction {
  action: string;
  source: "ruff";
  payload: Fix;
}

// ruff uses 1-indexed columns and rows but LSP expects 0-indexed columns and rows
function convertRange(start: Location, end: Location): Range {
  return {
    start: {
      line: Math.max(start.row - 1, 0),
      character: Math.max(start.column - 1, 0)
    },
    end: {
      line: Math.max(end.row - 1, 0),
      character: Math.max(end.column - 1, 0)
    }
  }
}

function convertEdit(edit: Edit): TextEdit {
  return {
    newText: edit.content,
    range: convertRange(edit.location, edit.end_location)
  }
}

const ErrorRegex = new RegExp(/^E\d{3}$/)
function convertDiagnostic(diag: RuffDiagnostic): Diagnostic {
  const category = diag.code.match(ErrorRegex) ? DiagnosticCategory.Error : DiagnosticCategory.Warning
  const convertedDiag = new Diagnostic(category, diag.message, convertRange(diag.location, diag.end_location))

  if (diag.fix) {
    const action: RuffAction = {
      action: diag.fix.message,
      source: "ruff",
      payload: diag.fix
    }
    convertedDiag.addAction(action)
  }

  convertedDiag.setRule(diag.code)
  return convertedDiag
}

// see https://beta.ruff.rs/docs/rules/ for more info
const RUFF_CODES = ["E", "F", "I", "RUF", "B", "C4"]
export function getRuffDiagnosticsFromBuffer(fp: string, buf: string): Diagnostic[] {
  const ruffArgs = RUFF_CODES.flatMap(code => (['--select', code]))
  const outBuf = spawnSync(`ruff`, ["check", "--stdin-filename", fp, ...ruffArgs, "--quiet", "--format=json", "--force-exclude", "-"], {
    input: buf
  })

  if (outBuf.error) {
    console.log(`Error running ruff: ${outBuf.stderr}`)
    return []
  }

  const stdout = outBuf.stdout.toString()
  const diags = JSON.parse(stdout) as RuffDiagnostic[]
  return diags.map(convertDiagnostic)
}

export function diagnosticsToCodeActions(docUri: string, diags: Diagnostic[]): CodeAction[] {
  return diags
    .filter(diag => {
      const actions = (diag.getActions() ?? []) as RuffAction[]
      const ruffActions = actions.filter(a => a.source === "ruff")
      return ruffActions.length > 0
    })
    .map(diag => {
      const action = diag.getActions()![0] as RuffAction
      const message = action.action
      const fix = action.payload

      const kind = CodeActionKind.SourceOrganizeImports
      const changes = {}
      changes[docUri] = fix.edits.map(convertEdit)
      const edit: WorkspaceEdit = { changes }
      return CodeAction.create(message, edit, kind)
    })
}
