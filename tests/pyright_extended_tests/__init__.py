import asyncio
import os
from datetime import datetime
from textwrap import dedent

import pytest
import pytest_lsp
from lsprotocol.types import (
    CompletionParams,
    CompletionList,
    DocumentFormattingParams,
    FormattingOptions,
    InitializeParams,
    Position,
    TextDocumentIdentifier,
    TextDocumentItem,
    DidOpenTextDocumentParams,
)
from pytest_lsp import (
    ClientServerConfig,
    LanguageClient,
)


def replit_client_capabilities():
    from lsprotocol import types
    from lsprotocol.converters import get_converter
    import json

    converter = get_converter()

    capabilities = json.load(open("clients/replit.json"))

    params = converter.structure(capabilities, types.InitializeParams)
    return params.capabilities


repl_home = os.getenv("REPL_HOME", ".")
lsp_path = os.path.join(repl_home, "packages/pyright/dist/pyright-langserver.js")
testroot = os.path.join(repl_home, "tests")


@pytest_lsp.fixture(
    config=ClientServerConfig(server_command=["node", lsp_path, "--stdio"])
)
async def client(lsp_client: LanguageClient):
    # Setup
    response = await lsp_client.initialize_session(
        InitializeParams(
            capabilities=replit_client_capabilities(),
            root_uri=f"file://{testroot}",
        )
    )

    yield

    # Teardown
    await lsp_client.shutdown_session()


@pytest.mark.asyncio
async def test_completion(client: LanguageClient):
    fileuri = f"file://{testroot}/cases/1.py"
    contents = dedent(
        """\
    0
    """
    )
    result = client.text_document_did_open(
        DidOpenTextDocumentParams(
            text_document=TextDocumentItem(
                uri=fileuri,
                language_id="python",
                text=contents,
                version=0,
            )
        )
    )

    result = await client.text_document_completion_async(
        params=CompletionParams(
            position=Position(line=1, character=0),
            text_document=TextDocumentIdentifier(uri=fileuri),
        )
    )

    assert isinstance(result, CompletionList)
    assert len(result.items) > 0


@pytest.mark.asyncio
async def test_linter(client: LanguageClient):
    fileuri = f"file://{testroot}/cases/2.py"
    contents = dedent(
        """\
    m = 2
    import sys
    """
    )

    client.text_document_did_open(
        DidOpenTextDocumentParams(
            text_document=TextDocumentItem(
                uri=fileuri,
                language_id="python",
                text=contents,
                version=0,
            )
        )
    )

    start = datetime.now()
    while True:
        delta = datetime.now() - start
        # Timeout of 2 seconds
        if delta.seconds > 1:
            break
        # Early termination if we got diagnostics
        if client.diagnostics:
            break
        await asyncio.sleep(0.25)

    assert fileuri in client.diagnostics, f"Diagnostics not found: {fileuri}"
    diagnostics = client.diagnostics[fileuri]
    assert diagnostics, f"Diagnostics empty for {fileuri}"
    assert (
        diagnostics[0].code == "ruff[E402]"
    ), f"Expected first warning to be import-at-top-of-file: {fileuri}"
    assert (
        diagnostics[1].code == "ruff[F401]"
    ), f"Expected second warning to be unused import: {fileuri}"


@pytest.mark.asyncio
async def test_formatting(client: LanguageClient):
    fileuri = f"file://{testroot}/cases/3.py"
    contents = dedent(
        """\
    import os
    x     =      "this is\\na test"
    print(os.getenv(  "PATH",   x))
    if True:
                  pass
    """
    )
    expected = dedent(
        """\
    import os

    x = "this is\\na test"
    print(os.getenv("PATH", x))
    if True:
        pass
    """
    )
    print(repr(contents))
    result = client.text_document_did_open(
        DidOpenTextDocumentParams(
            text_document=TextDocumentItem(
                uri=fileuri,
                language_id="python",
                text=contents,
                version=0,
            )
        )
    )

    result = await client.text_document_formatting_async(
        params=DocumentFormattingParams(
            text_document=TextDocumentIdentifier(uri=fileuri),
            options=FormattingOptions(
                tab_size=4,
                insert_spaces=True,
                trim_trailing_whitespace=True,
            )
        )
    )

    assert isinstance(result, list), result
    assert len(result) > 0
    assert result[0].new_text == expected
