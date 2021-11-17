{
  holonixPath ?  builtins.fetchTarball { url = "https://github.com/holochain/holonix/archive/d326ee858e051a2525a1ddb0452cab3085c4aa98.tar.gz"; }
}:

let
  holonix = import (holonixPath) {
    include = {
        # making this explicit even though it's the default
        holochainBinaries = true;
    };

    holochainVersionId = "custom";

    holochainVersion = {
      rev = "holochain-0.0.115";
      sha256 = "sha256:163fvii27wqpni7f5f0m0nxivjjdgsycb2pnd1jcadx9i9d70ziv";
      cargoSha256 = "sha256:1nmyk14d1v8y3wipjlff7bn38ay7zkp5fkzr7qbgm28kbai4ji3v";
      bins = {
        holochain = "holochain";
        hc = "hc";
        kitsune-p2p-proxy = "kitsune_p2p/proxy";
      };

      lairKeystoreHashes = {
        rev = "f2de1f4d426e72714f48018349e4df799fbcb81b";
        sha256 = "sha256:06vd1147323yhznf8qyhachcn6fs206h0c0bsx4npdc63p3a4m42";
        cargoSha256 = "sha256:0brgy77kx797pjnjhvxhzjv9cjywdi4l4i3mdpqx3kyrklavggcy";
      };
    };
  };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  buildInputs = with nixpkgs; [
    binaryen
    nodejs-16_x
  ];
}