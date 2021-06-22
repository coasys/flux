let 
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/3e94163765975f35f7d8ec509b33c3da52661bd1.tar.gz";
    sha256 = "07sl281r29ygh54dxys1qpjvlvmnh7iv1ppf79fbki96dj9ip7d2";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = { 
     rev = "8600350687dd80bbc7a5620e8fe71ad55c97eed2";
     sha256 = "15qxmcscmj6mmmcdz1bbj03gw2kw1qyicjb40y2zccmyi2zl5by9";
     cargoSha256 = "0c4jdb3myw9sdm24sxwk5mmgn5xl9ly11jiwkbpdds4pmnrz2mjd";
     bins = {
       holochain = "holochain";
       hc = "hc";
       lair-keystore = "lair-keystore";
     };
    };
  };
in holonix.main