import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/AppIcon';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg pb-20 pt-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-smooth"
          >
            <Icon name="ArrowLeft" size={24} />
          </button>
          <h1 className="text-2xl font-heading font-bold">À propos de Woofly</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-3xl p-8 shadow-soft">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl">
                🐾
              </div>
              <div>
                <h2 className="text-2xl font-bold">Woofly</h2>
                <p className="text-muted-foreground">Votre compagnon numérique</p>
              </div>
            </div>
            <p className="mb-4">
              <strong>Woofly</strong> est une application web gratuite conçue pour aider les propriétaires de chiens à gérer facilement la santé et le bien-être de leurs compagnons.
            </p>
            <p>
              Centralise toutes les informations importantes : vaccinations, traitements, poids, notes de santé et bien plus encore.
            </p>
          </div>

          <div className="bg-card rounded-3xl p-8 shadow-soft">
            <h2 className="text-xl font-bold mb-4">Fonctionnalités</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="Dog" size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Profils multiples</h3>
                  <p className="text-sm text-muted-foreground">Gérez plusieurs chiens</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name="Heart" size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Suivi de santé</h3>
                  <p className="text-sm text-muted-foreground">Vaccinations et traitements</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-100">
            <h2 className="text-xl font-bold mb-4">Notre mission</h2>
            <p className="mb-4">
              Simplifier la vie des propriétaires de chiens en centralisant toutes les informations importantes.
            </p>
            <p>
              Woofly est et restera <strong>100% gratuit</strong>.
            </p>
          </div>

          <div className="bg-card rounded-3xl p-8 shadow-soft">
            <h2 className="text-xl font-bold mb-4">Le créateur</h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                OA
              </div>
              <div>
                <h3 className="font-semibold mb-2">Olivier Avril</h3>
                <p className="text-muted-foreground mb-3">
                  Développeur passionné et amoureux des animaux.
                </p>
                <a
                  href="mailto:inbyoliver@gmail.com"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Icon name="Mail" size={18} />
                  inbyoliver@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
