{pkgs}: {
  deps = [
    pkgs.nix-output-monitor
    pkgs.jq
    pkgs.sqlite-interactive
    pkgs.postgresql
  ];
}
