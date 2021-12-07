
{
  holonixPath ?  builtins.fetchTarball { url = "https://github.com/holochain/holonix/archive/089a6f2f1627f0bd7e15c848b9f6886eb5d32c05.tar.gz"; }
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