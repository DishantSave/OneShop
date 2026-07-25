clear
$basePath = "D:\Dishant\My_Ecommerce_Website\OneShop\Database\Database" #"D:\Dishant\Dishant_Projects\OneShop\Database\Database"
$DBName = "ONESHOP"
$ServerName = "HOME-LP-DISHANT\SQLEXPRESS" #"AMT-LP-DISHANT"
$userName = "sa"
$password = "psa123#"

$versionFolders = Get-ChildItem -Path $basePath | Where-Object { $_.PSIsContainer } | Sort-Object Name

$ExecutionOrder = @(
    "TableScripts", 
    "StoredProcedures", 
    "Triggers&Functions"
)

$foldersToSkip = @("bin", "obj")

foreach ($version in $versionFolders) {
    
    if ($foldersToSkip -contains $version.Name) { continue }

    Write-Host "--- Processing Version: $($version.Name) ---" -ForegroundColor Cyan
        
    foreach ($folderName in $ExecutionOrder) {
        $targetFolder = Join-Path $version.FullName $folderName
        
        if (Test-Path $targetFolder) {
            
            Write-Host "--- Processing Folder: $folderName ---" -ForegroundColor Green

            $scripts = Get-ChildItem -Path $targetFolder -Filter *.sql | Sort-Object Name
            foreach ($script in $scripts) {
                Write-Host "Executing: $($script.Name)"
                sqlcmd -S $ServerName -d $DBName -U $userName -P $password -I -i $script.FullName
            }
        }
    }
}