$src='C:\Users\2ой пользователь\kpop 2 — копия (3)\clothes'
$dst='C:\Users\2ой пользователь\kpop 2 — копия (3)\game\public\clothes'
$result = [ordered]@{
    srcPath = $src
    dstPath = $dst
    srcExists = Test-Path $src
    srcSubdirs = @()
    dstExists = Test-Path $dst
    dstSubdirs = @()
    totalDstPngs = 0
    copyPerformed = $false
    copyDetails = @()
}

if ($result.srcExists) {
    $srcDirs = Get-ChildItem -Path $src -Directory -ErrorAction SilentlyContinue
    foreach ($d in $srcDirs) {
        $count = (Get-ChildItem -Path $d.FullName -Filter '*.png' -File -ErrorAction SilentlyContinue | Measure-Object).Count
        $result.srcSubdirs += [ordered]@{ name = $d.Name; pngCount = $count }
    }
}

if ($result.dstExists) {
    $dstDirs = Get-ChildItem -Path $dst -Directory -ErrorAction SilentlyContinue
    foreach ($d in $dstDirs) {
        $count = (Get-ChildItem -Path $d.FullName -Filter '*.png' -File -ErrorAction SilentlyContinue | Measure-Object).Count
        $result.dstSubdirs += [ordered]@{ name = $d.Name; pngCount = $count }
    }
    $result.totalDstPngs = (Get-ChildItem -Path $dst -Filter '*.png' -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
}

if ($result.dstExists -and $result.totalDstPngs -eq 0) {
    $result.copyPerformed = $true
    $cats = @('top','bot','shoe','accessory')
    foreach ($c in $cats) {
        $sdir = Join-Path $src $c
        $ddir = Join-Path $dst $c
        if (Test-Path $sdir) {
            # ensure destination directory exists
            New-Item -ItemType Directory -Path $ddir -Force | Out-Null
            $files = Get-ChildItem -Path $sdir -Filter '*.png' -File -ErrorAction SilentlyContinue
            $countSrc = $files.Count
            if ($countSrc -gt 0) {
                foreach ($f in $files) {
                    Copy-Item -Path $f.FullName -Destination $ddir -Force -ErrorAction SilentlyContinue
                }
                $countCopied = (Get-ChildItem -Path $ddir -Filter '*.png' -File -ErrorAction SilentlyContinue | Measure-Object).Count
                $result.copyDetails += [ordered]@{ name=$c; copied=$countCopied }
            } else {
                $result.copyDetails += [ordered]@{ name=$c; copied=0; note='no source files' }
            }
        } else {
            $result.copyDetails += [ordered]@{ name=$c; copied=0; note='source missing' }
        }
    }
}

# final destination counts
if (Test-Path $dst) {
    $finalDirs = Get-ChildItem -Path $dst -Directory -ErrorAction SilentlyContinue
    $result.dstSubdirs = @()
    foreach ($d in $finalDirs) {
        $count = (Get-ChildItem -Path $d.FullName -Filter '*.png' -File -ErrorAction SilentlyContinue | Measure-Object).Count
        $result.dstSubdirs += [ordered]@{ name = $d.Name; pngCount = $count }
    }
    $result.totalDstPngs = (Get-ChildItem -Path $dst -Filter '*.png' -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
}

# write JSON report
$reportPath = Join-Path (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent) 'check_and_copy_result.json'
$result | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding utf8
Write-Output "WROTE_REPORT:$reportPath"
ConvertTo-Json $result -Depth 5
