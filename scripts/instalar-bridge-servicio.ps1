<#
  Instala el Tango bridge como tarea programada de Windows.
  - Arranca solo al iniciar la maquina (sin que nadie inicie sesion).
  - Corre oculto (sin ventana de consola).
  - Se reinicia solo si se cae.

  USO (en la maquina de la red que llega a SRVTANGO, PowerShell COMO ADMINISTRADOR):
    cd <repo>
    powershell -ExecutionPolicy Bypass -File scripts\instalar-bridge-servicio.ps1

  Para desinstalar:
    Unregister-ScheduledTask -TaskName "CDP Tango Bridge" -Confirm:$false
#>

$ErrorActionPreference = "Stop"
$TaskName = "CDP Tango Bridge"

# Repo = carpeta padre de \scripts
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$script = Join-Path $repo "scripts\tango-bridge.mjs"
if (-not (Test-Path $script)) { throw "No encuentro $script" }

# Ruta de node
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw "No encuentro 'node' en el PATH. Instala Node.js o ajusta la ruta." }

# Chequear que exista .env.local con las credenciales
if (-not (Test-Path (Join-Path $repo ".env.local"))) {
  Write-Warning "No hay .env.local en $repo (el bridge lo necesita: TANGO_DB_* + BRIDGE_SECRET)."
}

Write-Output "Repo : $repo"
Write-Output "Node : $node"
Write-Output "Tarea: $TaskName"

$arg     = '"' + $script + '"'
$action  = New-ScheduledTaskAction -Execute $node -Argument $arg -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal `
  -Settings $settings -Description "Bridge HTTP read-only de Tango para el dashboard CDP" -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 3

$state = (Get-ScheduledTask -TaskName $TaskName).State
Write-Output "Estado de la tarea: $state"
try {
  $r = Invoke-RestMethod -Uri "http://localhost:8787/health" -TimeoutSec 5
  Write-Output ("Health check: OK " + ($r | ConvertTo-Json -Compress))
} catch {
  Write-Warning "El bridge todavia no responde en :8787. Revisa .env.local y los logs (Task Scheduler)."
}
Write-Output ""
Write-Output "Listo. El bridge arranca solo al reiniciar la maquina."
Write-Output "Falta publicarlo con Cloudflare Tunnel (ver docs/tango-bridge.md)."
