Add-Type -AssemblyName System.Web
$csvPath = 'd:\chatbot\medications.csv'
$jsPath = 'd:\chatbot\med-data.js'

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$sb = New-Object System.Text.StringBuilder
$null = $sb.Append('var MEDICATIONS_DATA = [')

$data = Import-Csv -Path $csvPath -Encoding UTF8
$first = $true
foreach ($row in $data) {
    if (-not $first) { $null = $sb.Append(',') }
    $first = $false
    
    # Escape all string values for JS
    $name = $row.Name -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $brands = $row.Brands -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $category = $row.Category -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $uses = $row.Uses -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $dosageAdult = $row.DosageAdult -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $dosageChild = $row.DosageChild -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $sideEffects = $row.SideEffects -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $warnings = $row.Warnings -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $interactions = $row.Interactions -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $packSize = $row.PackSize -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $price = $row.Price -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $availability = $row.Availability -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    $buyLink = $row.BuyLink -replace '\\', '\\' -replace '"', '\"' -replace "`r`n|`r|`n", ' '
    
    $null = $sb.Append("{""name"":""$name"",""brands"":""$brands"",""category"":""$category"",""uses"":""$uses"",""dosage_adult"":""$dosageAdult"",""dosage_pediatric"":""$dosageChild"",""sideEffects"":""$sideEffects"",""warnings"":""$warnings"",""interactions"":""$interactions"",""pack_size"":""$packSize"",""price"":""$price"",""availability"":""$availability"",""buy_link"":""$buyLink""}")
}

$null = $sb.Append('];')
[IO.File]::WriteAllText($jsPath, $sb.ToString(), $utf8NoBom)
Write-Host "Done! Generated $($data.Count) records."
