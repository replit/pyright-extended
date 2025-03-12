/// <reference path="typings/fourslash.d.ts" />

// @filename: testpkg/py.typed
// @library: true
////

// @filename: testpkg/__init__.py
// @library: true
//// __all__ = ["submod"]

// @filename: testpkg/submod.py
// @library: true
//// def test_func():
////     print("hi")

// @filename: .src/test.py
//// # pyright: reportWildcardImportFromLibrary=false
//// [|/*imprt*/from testpkg import *|]
////
//// [|/*marker1*/submod|].test_func()

// @ts-ignore
await helper.verifyDiagnostics({
    imprt: { category: 'warning', message: `\`from testpkg import *\` used; unable to detect undefined names` },
    marker1: { category: 'warning', message: `\`submod\` may be undefined, or defined from star imports` },
});
