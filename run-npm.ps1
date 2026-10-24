$NpmArguments = @($args)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (!$NpmArguments) { $NpmArguments = @('run', 'dev') }
$taskSystemNpm = Get-Command npm.cmd -ErrorAction SilentlyContinue
$taskNode = Get-Command node -ErrorAction SilentlyContinue
$taskLocalNpm = Join-Path $PSScriptRoot '.tools/package/bin/npm-cli.js'
if ($taskSystemNpm) { & $taskSystemNpm.Source @NpmArguments }
elseif ($taskNode -and (Test-Path -LiteralPath $taskLocalNpm)) { & $taskNode.Source $taskLocalNpm @NpmArguments }
else { throw '未找到 npm。请安装 Node.js 24 LTS（自带npm），重新打开终端后再运行。' }
$taskExitCode = $LASTEXITCODE
exit $taskExitCode
