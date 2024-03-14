{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    packages = [
        pkgs.python312
        pkgs.poetry
    ];
  }
