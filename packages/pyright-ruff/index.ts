import { Diagnostic, DiagnosticCategory } from '../pyright-internal/src/common/diagnostic'
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
      line: diag.location.row - 1,
      character: diag.location.column - 1
    } ,
    end: {
      line: diag.end_location.row - 1,
      character: diag.end_location.column - 1
    }
  })
  convertedDiag.setRule(diag.code)
  return convertedDiag
}

export function getRuffDiagnosticsFromBuffer(fp: string, buf: string): Diagnostic[] {
    const outBuf = spawnSync(`ruff`, ["check", "--stdin-filename", fp, "--quiet", "--format=json", "--force-exclude", "-"], {
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
