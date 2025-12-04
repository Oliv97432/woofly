import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/AppIcon';

const PolitiqueConfidentialite = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg pb-20 pt-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-smooth"
          >
            <Icon name="ArrowLeft" size={24} className="text-foreground" />
          </button>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Politique de Confidentialité
          </h1>
        </div>

        {/* Contenu */}
        <div className="bg-card rounded-3xl p-6 md:p-8 shadow-soft border border-border prose prose-sm max-w-none">
          <p className="text-sm text-muted-foreground mb-6">
            Dernière mise à jour : Décembre 2024
          </p>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg not-prose mb-6">
            <p className="text-sm text-blue-900">
              <strong>📋 Résumé :</strong> Nous collectons uniquement les données nécessaires au fonctionnement de l'application. Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.
            </p>
          </div>

          <h2>1. Responsable du traitement</h2>
          <p><strong>Nom :</strong> Olivier Avril</p>
          <p><strong>Email :</strong>{' '}
            <a href="mailto:inbyoliver@gmail.com" className="text-primary hover:underline">
              inbyoliver@gmail.com
            </a>
          </p>

          <h2>2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          
          <h3>2.1. Données d'inscription</h3>
          <ul>
            <li>Adresse e-mail (obligatoire)</li>
            <li>Mot de passe (chiffré)</li>
            <li>Nom complet (optionnel)</li>
            <li>Numéro de téléphone (optionnel)</li>
            <li>Code postal (optionnel)</li>
          </ul>

          <h3>2.2. Données sur vos chiens</h3>
          <ul>
            <li>Nom, race, date de naissance, poids</li>
            <li>Photos</li>
            <li>Informations médicales (vaccinations, traitements)</li>
            <li>Notes de santé</li>
          </ul>

          <h3>2.3. Données d'utilisation</h3>
          <ul>
            <li>Posts et commentaires dans le forum</li>
            <li>Contacts vétérinaires enregistrés</li>
            <li>Dates de connexion</li>
          </ul>

          <h2>3. Finalités du traitement</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>Créer et gérer votre compte utilisateur</li>
            <li>Vous permettre d'utiliser les fonctionnalités de l'application</li>
            <li>Stocker et afficher les informations sur vos chiens</li>
            <li>Vous envoyer des notifications importantes (mises à jour, sécurité)</li>
            <li>Améliorer l'application</li>
          </ul>

          <h2>4. Base légale du traitement</h2>
          <p>Le traitement de vos données repose sur :</p>
          <ul>
            <li><strong>Votre consentement</strong> lors de la création de votre compte</li>
            <li><strong>L'exécution du contrat</strong> (fourniture du service)</li>
            <li><strong>Nos obligations légales</strong> (conservation des données, sécurité)</li>
          </ul>

          <h2>5. Durée de conservation</h2>
          <p>Vos données sont conservées :</p>
          <ul>
            <li><strong>Compte actif :</strong> Tant que votre compte existe</li>
            <li><strong>Après suppression :</strong> 30 jours (pour permettre une éventuelle récupération), puis suppression définitive</li>
            <li><strong>Données de connexion :</strong> 1 an maximum</li>
          </ul>

          <h2>6. Destinataires des données</h2>
          <p>Vos données sont stockées sur :</p>
          <ul>
            <li><strong>Supabase</strong> (hébergement de la base de données)</li>
            <li><strong>Vercel</strong> (hébergement de l'application web)</li>
          </ul>
          <p>
            Ces sous-traitants sont conformes au RGPD et ont signé des clauses contractuelles types.
          </p>
          <p>
            <strong>Important :</strong> Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.
          </p>

          <h2>7. Sécurité des données</h2>
          <p>Nous mettons en œuvre les mesures de sécurité suivantes :</p>
          <ul>
            <li>Chiffrement des mots de passe</li>
            <li>Connexion HTTPS sécurisée</li>
            <li>Authentification sécurisée (Supabase Auth)</li>
            <li>Sauvegardes régulières</li>
            <li>Contrôle d'accès strict aux données</li>
          </ul>

          <h2>8. Vos droits (RGPD)</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          
          <h3>8.1. Droit d'accès</h3>
          <p>Vous pouvez demander une copie de toutes vos données personnelles.</p>

          <h3>8.2. Droit de rectification</h3>
          <p>Vous pouvez corriger vos données inexactes ou incomplètes directement dans l'application.</p>

          <h3>8.3. Droit à l'effacement</h3>
          <p>Vous pouvez demander la suppression de votre compte et de toutes vos données.</p>

          <h3>8.4. Droit à la portabilité</h3>
          <p>Vous pouvez récupérer vos données dans un format structuré et couramment utilisé.</p>

          <h3>8.5. Droit d'opposition</h3>
          <p>Vous pouvez vous opposer au traitement de vos données pour des motifs légitimes.</p>

          <h3>8.6. Droit de limitation</h3>
          <p>Vous pouvez demander la limitation du traitement de vos données.</p>

          <h2>9. Exercer vos droits</h2>
          <p>Pour exercer vos droits, contactez-nous à :</p>
          <p>
            <strong>Email :</strong>{' '}
            <a href="mailto:inbyoliver@gmail.com" className="text-primary hover:underline">
              inbyoliver@gmail.com
            </a>
          </p>
          <p>
            Nous vous répondrons dans un délai maximum de 1 mois.
          </p>

          <h2>10. Droit de réclamation</h2>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL :
          </p>
          <p>
            <strong>CNIL</strong><br />
            3 Place de Fontenoy<br />
            TSA 80715<br />
            75334 PARIS CEDEX 07<br />
            <a href="https://www.cnil.fr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              www.cnil.fr
            </a>
          </p>

          <h2>11. Cookies</h2>
          <p>
            Woofly utilise uniquement des cookies strictement nécessaires au fonctionnement de l'application (authentification, session).
          </p>
          <p>
            Aucun cookie de tracking, publicitaire ou analytique n'est utilisé actuellement.
          </p>

          <h2>12. Transferts internationaux</h2>
          <p>
            Vos données peuvent être hébergées sur des serveurs situés en dehors de l'Union Européenne (États-Unis pour Vercel et Supabase).
          </p>
          <p>
            Ces transferts sont encadrés par des clauses contractuelles types approuvées par la Commission Européenne.
          </p>

          <h2>13. Modifications</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique de confidentialité. Toute modification sera communiquée par e-mail.
          </p>

          <div className="mt-8 p-6 bg-muted rounded-2xl not-prose">
            <h3 className="text-lg font-heading font-bold text-foreground mb-3">
              Des questions ?
            </h3>
            <p className="text-foreground mb-2">
              Pour toute question concernant la protection de vos données :
            </p>
            <p className="text-foreground">
              <strong>Email :</strong>{' '}
              <a href="mailto:inbyoliver@gmail.com" className="text-primary hover:underline">
                inbyoliver@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolitiqueConfidentialite;
