$root='C:\Users\2ой пользователь\kpop 1.3'
$paths = @('faces\\normalized','avatars\\normalized','clothes','gifts')
foreach($p in $paths) {
  $full = Join-Path $root $p
  if (Test-Path $full) {
    Write-Output "Found $p :"
    Get-ChildItem -LiteralPath $full -Recurse -File | Select-Object -First 10 | ForEach-Object { Write-Output " - $($_.FullName)" }
    $count = (Get-ChildItem -LiteralPath $full -Recurse -File | Measure-Object).Count
    Write-Output " Count: $count"
  } else {
    Write-Output "Missing: $p"
  }
}
