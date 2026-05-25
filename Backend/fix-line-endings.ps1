# Fix line endings for Linux deployment
Write-Host "🔧 Fixing line endings for Linux deployment..." -ForegroundColor Yellow

# Read the file content
$content = Get-Content "entrypoint.sh" -Raw

# Convert CRLF to LF
$content = $content -replace "`r`n", "`n"

# Write back with UTF-8 encoding and LF line endings
[System.IO.File]::WriteAllText("entrypoint.sh", $content, [System.Text.UTF8Encoding]::new($false))

Write-Host "✅ Line endings fixed for entrypoint.sh" -ForegroundColor Green