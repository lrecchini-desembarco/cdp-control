<#
  Mata cualquier dev de Next escuchando en 3000-3010 (sin borrar .next).
  Se corre AUTOMATICO antes de "npm run dev" (hook predev) para que nunca se
  acumulen varios dev servers (la causa del ChunkLoadError / puerto 3001, 3002...).
  Siempre sale 0 para no frenar el arranque del dev.
#>
try {
  $pids = 3000..3010 | ForEach-Object {
    try { (Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction Stop).OwningProcess } catch {}
  } | Sort-Object -Unique
  foreach ($id in $pids) {
    $p = Get-Process -Id $id -ErrorAction SilentlyContinue
    if ($p -and $p.ProcessName -match "node") { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
  }
} catch {}
exit 0
