/// <reference path="typings/fourslash.d.ts" />

// @filename: pyrightconfig.json
//// {
////   "typeCheckingMode": "basic"
//// }

// @filename: testLib/py.typed
// @library: true
////

// @filename: testLib/__init__.py
// @library: true
//// from .module1 import one as one, two, three
//// four: int = two * two
//// _five: int = two + three
//// _six: int = 6
//// __all__ = ["_six"]

// @filename: testLib/module1.py
// @library: true
//// one: int = 1
//// two: int = 2
//// three: int = 3

// @filename: .src/test1.py
//// # pyright: reportPrivateUsage=true, reportPrivateImportUsage=true
//// import testLib
//// from testLib import [|/*marker3*/_five|], _six, four, one, [|/*marker2*/three|]
//// from testLib import [|/*marker1*/two|] as two_alias
////
//// a = testLib.one
//// b = testLib.[|/*marker4*/two|]
//// c = testLib.[|/*marker5*/three|]
//// d = testLib.four
//// e = testLib.[|/*marker6*/_five|]
//// f = testLib._six
//// print(a + b + c + d + e + f)

// @ts-ignore
await helper.verifyDiagnostics({
    marker1: {
        category: 'error',
        message: `"two" is not exported from module "testLib"\n  Import from \"testLib.module1\" instead`,
    },
    marker2: {
        category: 'error',
        message: `"three" is not exported from module "testLib"\n  Import from \"testLib.module1\" instead`,
    },
    marker3: {
        category: 'error',
        message: `"_five" is private and used outside of the module in which it is declared`,
    },
    marker4: { category: 'error', message: `"two" is not exported from module "testLib"` },
    marker5: {
        category: 'error',
        message: `"three" is not exported from module "testLib"`,
    },
    marker6: {
        category: 'error',
        message: `"_five" is private and used outside of the module in which it is declared`,
    },
});
