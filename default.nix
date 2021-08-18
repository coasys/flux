let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/99a09650d4b3a04bce7c8be19a119ad9cdea3189.tar.gz";
    sha256 = "sha256:0lbgnnn82c2lq1w0xg739i15pim51h02crfighill28akhaazx7b";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = {
     rev = "f3d17d993ad8d988402cc01d73a0095484efbabb";
     sha256 = "1z0y1bl1j2cfv4cgr4k7y0pxnkbiv5c0xv89y8dqnr32vli3bld7";
     cargoSha256 = "sha256:1rf8vg832qyymw0a4x247g0iikk6kswkllfrd5fqdr0qgf9prc31";
     bins = {
       holochain = "holochain";
       hc = "hc";
       lair-keystore = "lair-keystore";
     };
    };
    holochainOtherDepsNames = ["lair-keystore"];
  };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  buildInputs = with nixpkgs; [
    binaryen
  ];
}