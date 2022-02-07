{
  holonixPath ?  builtins.fetchTarball { url = "https://github.com/holochain/holonix/archive/99fbe2026e774b29b265f81bf68a9cf0b21b31c3.tar.gz"; }
}:

let
  holonix = import (holonixPath) { };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  buildInputs = with nixpkgs; [
    binaryen
    nodejs-16_x
  ];
}