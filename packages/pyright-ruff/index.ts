import { Diagnostic, DiagnosticAction, DiagnosticCategory } from '../pyright-internal/src/common/diagnostic'
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

const ErrorRegex = new RegExp(/^E\d{3}$/)
function convertDiagnostic(diag: RuffDiagnostic): Diagnostic {
  const category = diag.code.match(ErrorRegex) ? DiagnosticCategory.Error : DiagnosticCategory.Warning
  const convertedDiag = new Diagnostic(category, diag.message, {
    start: {
      line: Math.max(diag.location.row - 1, 0),
      character: Math.max(diag.location.column - 1, 0)
    } ,
    end: {
      line: Math.max(diag.end_location.row - 1, 0),
      character: Math.max(diag.end_location.column - 1, 0)
    }
  })

  if (diag.fix) {
    const action = {
      edits: diag.fix.edits,
      applicability: diag.fix.applicability,
      action: diag.fix.message
    } as DiagnosticAction
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
