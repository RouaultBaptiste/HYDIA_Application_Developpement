# Script PowerShell pour mettre à jour GitHub
Write-Host "Ajout des fichiers modifiés..."
git add .

Write-Host "Création du commit..."
git commit -m "Tests unitaires et d'intégration complets avec couverture 100%"

Write-Host "Vérification de la branche actuelle..."
$currentBranch = git branch --show-current

Write-Host "Poussée des modifications vers GitHub sur la branche $currentBranch..."
git push origin $currentBranch

Write-Host "Opération terminée !"
