$src = 'c:\Users\Sai kiran\Desktop\Sadhyam\Frontend\src\styles.css.tmp'
$dst = 'c:\Users\Sai kiran\Desktop\Sadhyam\Frontend\src\styles.css'
# Read the clean 1495-line file and the current file
$clean = Get-Content $src
# Write to a second temp, then rename
$out = 'c:\Users\Sai kiran\Desktop\Sadhyam\Frontend\src\styles2.css'
$clean | Set-Content -Path $out -Encoding UTF8
Write-Host "Wrote $($clean.Count) lines to $out"
