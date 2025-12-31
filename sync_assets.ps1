$root = "C:\Users\2ой пользователь\kpop 1.3"
function Copy-Dir($srcRel, $dstRel) {
    $src = Join-Path $root $srcRel
    $dst = Join-Path $root (Join-Path "game\public" $dstRel)
    if (Test-Path $src) {
        New-Item -ItemType Directory -Force -Path $dst | Out-Null
        Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force -ErrorAction SilentlyContinue
        Write-Output "Copied: $src -> $dst"
    } else {
        Write-Output "Source not found: $src"
    }
}

Copy-Dir "faces\normalized" "faces\normalized"
Copy-Dir "clothes" "clothes"
Copy-Dir "avatars\normalized" "avatars\normalized"
Copy-Dir "gifts" "gifts"

Write-Output "Sync complete."