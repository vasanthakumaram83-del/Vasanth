$ErrorActionPreference = 'Stop'
$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = (Get-Command node -ErrorAction Stop).Source
$logPath = Join-Path $env:TEMP ("daymark-" + [guid]::NewGuid().ToString('N') + '.log')
$errorPath = "$logPath.err"
$previousPort = $env:PORT
Remove-Item Env:PORT -ErrorAction SilentlyContinue
$server = Start-Process -FilePath $node -ArgumentList 'server.mjs' -WorkingDirectory $appDir -WindowStyle Hidden -RedirectStandardOutput $logPath -RedirectStandardError $errorPath -PassThru
if ($null -ne $previousPort) { $env:PORT = $previousPort }
$url = $null
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 250
    if ($server.HasExited) { break }
    if (Test-Path $logPath) {
        $line = Get-Content $logPath -Raw
        if ($line -match 'Discipline tracker at (http://127\.0\.0\.1:\d+)') { $url = $Matches[1]; break }
    }
}
if (-not $url) {
    $details = if (Test-Path $errorPath) { Get-Content $errorPath -Raw } else { 'No startup message was received.' }
    throw "Daymark did not start. $details"
}
Start-Process $url
