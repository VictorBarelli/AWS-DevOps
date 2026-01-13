# GameSwipe - Script de Deploy para AWS S3
# Execute: .\deploy.ps1

param(
    [string]$BucketName = "gameswipe-victor"  # Mude para o nome do seu bucket
)

Write-Host "🎮 GameSwipe - Deploy para AWS S3" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. Build do projeto
Write-Host "`n📦 Gerando build de produção..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído!" -ForegroundColor Green

# 2. Sincronizar com S3
Write-Host "`n☁️ Enviando para S3..." -ForegroundColor Yellow

# Verifica se AWS CLI está instalado
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instale em: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Sync da pasta dist com o bucket S3
aws s3 sync ./dist s3://$BucketName --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar para S3!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deploy concluído!" -ForegroundColor Green

# 3. Mostrar URL
Write-Host "`n🌐 Seu site está disponível em:" -ForegroundColor Cyan
Write-Host "http://$BucketName.s3-website-us-east-1.amazonaws.com" -ForegroundColor White

Write-Host "`n🎉 Deploy finalizado com sucesso!" -ForegroundColor Green
