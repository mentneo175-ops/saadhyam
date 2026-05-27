$file = 'c:\Users\Sai kiran\Desktop\Sadhyam\Frontend\src\styles.css'
$lines = Get-Content $file
$keep = $lines[0..1494]
$tmp = $file + '.tmp'
$keep | Set-Content -Path $tmp -Encoding UTF8
Write-Host "Wrote $($keep.Count) lines to $tmp"
