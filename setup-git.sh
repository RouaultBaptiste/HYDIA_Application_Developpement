#!/bin/bash

# Supprimer tout ancien répertoire .git
rm -rf .git

# Initialiser un nouveau dépôt Git
git init

# Configurer le dépôt distant
git remote add origin https://github.com/RouaultBaptiste/HYDIA_Application_Developpement.git

# Ajouter tous les fichiers
git add .

# Faire un commit initial
git commit -m "Initial commit: Projet Hydia SaaS complet avec backend et frontend"

# Pousser vers GitHub
git push -u origin main || git push -u origin master

echo "Terminé! Vérifiez votre dépôt GitHub."
