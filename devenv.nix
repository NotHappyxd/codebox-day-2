{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/basics/
  env.GREET = "devenv";
  dotenv.enable = true;

  # https://devenv.sh/packages/
  packages = [ pkgs.git ];

  # https://devenv.sh/languages/
  # languages.rust.enable = true;

  # https://devenv.sh/processes/
  # processes.dev.exec = "${lib.getExe pkgs.watchexec} -n -- ls -la";

  # https://devenv.sh/services/
  # services.postgres.enable = true;

  languages = {
    javascript = {
      enable = true;
      npm.enable = true;
    };

    typescript.enable = true;
  };

  services = {
    mongodb = {
      enable = true;
      initDatabaseUsername = config.env.MONGODB_USERNAME;
      initDatabasePassword = config.env.MONGODB_PASSWORD;
      additionalArgs = [
        "--auth"
        "--bind_ip"
        "127.0.0.1"
        "--port"
        "27017"
      ];
    };
  };
  # https://devenv.sh/scripts/
  scripts.hello.exec = ''
    echo hello from $GREET
  '';

  # https://devenv.sh/basics/
  enterShell = ''
    export MONGODB_URI="mongodb://$MONGODB_USERNAME:$MONGODB_PASSWORD@127.0.0.1:27017/$MONGODB_DATABASE?authSource=admin"
    hello         # Run scripts directly
    git --version # Use packages
  '';

  # https://devenv.sh/tasks/
  # tasks = {
  #   "myproj:setup".exec = "mytool build";
  #   "devenv:enterShell".after = [ "myproj:setup" ];
  # };

  # https://devenv.sh/tests/
  enterTest = ''
    echo "Running tests"
    git --version | grep --color=auto "${pkgs.git.version}"
  '';

  # https://devenv.sh/git-hooks/
  # git-hooks.hooks.shellcheck.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
