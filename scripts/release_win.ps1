$FolderName = "public/log-parser"
if (Test-Path $FolderName) {
    Remove-Item $FolderName -Recurse -Force
}

$FolderName = "public/util"
if (Test-Path $FolderName) {
    Remove-Item $FolderName -Recurse -Force
}

Copy-Item -R src-electron/log-parser public/

Copy-Item -R src-electron/util public/

quasar build -m electron -P always
