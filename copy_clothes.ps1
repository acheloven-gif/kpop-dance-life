$ErrorActionPreference = "SilentlyContinue"

# Define paths with proper encoding
$root = "C:\Users\2ой пользователь\kpop 2 — копия (3)"
$source = "$root\clothes"
$dest = "$root\game\public\clothes"

# Function to copy files
function Copy-ClothesFiles {
    param($category)
    
    $srcPath = "$source\$category"
    $dstPath = "$dest\$category"
    
    if (Test-Path $srcPath) {
        $files = Get-ChildItem $srcPath -Filter "*.png" -File
        $files | ForEach-Object {
            $destFile = Join-Path $dstPath $_.Name
            [System.IO.File]::Copy($_.FullName, $destFile, $true)
        }
        $count = (Get-ChildItem $dstPath -File).Count
        Write-Output "Copied $category`: $count files"
    }
}

# Ensure destination directory exists
if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

# Copy all categories
Copy-ClothesFiles "top"
Copy-ClothesFiles "bot"
Copy-ClothesFiles "shoe"
Copy-ClothesFiles "accessory"

Write-Output "All clothes copied successfully!"

# Final verification
$totalFiles = (Get-ChildItem $dest -Recurse -File).Count
Write-Output "Total files: $totalFiles"
