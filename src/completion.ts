const COMMANDS = ['init', 'config', 'ls', 'download', 'upload', 'copy', 'rm', 'completion'];

/** Minimal hand-rolled completion scripts (no shell runtime dependencies). */
export class CompletionScripts {
  get(shell: string): string | undefined {
    switch (shell) {
      case 'bash':
        return this.bash();
      case 'zsh':
        return this.zsh();
      case 'powershell':
        return this.powershell();
      default:
        return undefined;
    }
  }

  private bash(): string {
    const words = COMMANDS.join(' ');
    return [
      '_obs_cli() {',
      '  local cur="${COMP_WORDS[COMP_CWORD]}"',
      `  if [[ "$COMP_CWORD" -eq 1 ]]; then`,
      `    COMPREPLY=( $(compgen -W "${words}" -- "$cur") )`,
      '    return 0',
      '  fi',
      '}',
      'complete -F _obs_cli obs-cli',
    ].join('\n');
  }

  private zsh(): string {
    const words = COMMANDS.join(' ');
    return [
      '#compdef obs-cli',
      '_obs_cli() {',
      '  local -a commands',
      `  commands=(${words})`,
      '  if (( CURRENT == 2 )); then',
      '    _describe "command" commands',
      '    return 0',
      '  fi',
      '}',
      '_obs_cli "$@"',
    ].join('\n');
  }

  private powershell(): string {
    return [
      'Register-ArgumentCompleter -CommandName obs-cli -ScriptBlock {',
      '    param($wordToComplete)',
      `    $commands = @('${COMMANDS.join("', '")}')`,
      '    $commands | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {',
      "        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)",
      '    }',
      '}',
    ].join('\n');
  }
}
