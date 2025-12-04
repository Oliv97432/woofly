import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/AppIcon';

const Contact = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    setSending(true);

    // Créer le mailto link
    const subject = encodeURIComponent(formData.subject);
    const body = encodeURIComponent(
      `Nom: ${formData.name}\n` +
      `Email: ${formData.email}\n\n` +
      `Message:\n${formData.message}`
    );
    const mailtoLink = `mailto:inbyoliver@gmail.com?subject=${subject}&body=${body}`;

    // Ouvrir le client email
    window.location.href = mailtoLink;

    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-brand-bg pb-20 pt-4 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-smooth"
          >
            <Icon name="ArrowLeft" size={24} className="text-foreground" />
          </button>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Nous contacter
          </h1>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 mb-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="Mail" size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-foreground mb-2">
                Une question, une suggestion ?
              </h2>
              <p className="text-muted-foreground text-sm mb-3">
                N'hésitez pas à nous écrire ! Nous répondons généralement sous 48h.
              </p>
              <a
                href="mailto:inbyoliver@gmail.com"
                className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
              >
                <Icon name="Mail" size={16} />
                inbyoliver@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        {!sent ? (
          <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-6 md:p-8 shadow-soft border border-border">
            <div className="space-y-5">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nom <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Votre nom"
                  required
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                />
              </div>

              {/* Sujet */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Sujet <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  placeholder="Ex: Problème d'inscription, Suggestion de fonctionnalité..."
                  required
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Message <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Décrivez votre demande en détail..."
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth resize-none"
                />
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={sending}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={20} />
                    <span>Envoyer le message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Message de confirmation */
          <div className="bg-card rounded-3xl p-8 shadow-soft border border-border text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Check" size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">
              Message envoyé !
            </h2>
            <p className="text-muted-foreground mb-6">
              Votre client email s'est ouvert avec votre message. N'oubliez pas d'envoyer l'email.
            </p>
            <button
              onClick={() => setSent(false)}
              className="px-6 py-2.5 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-smooth"
            >
              Envoyer un autre message
            </button>
          </div>
        )}

        {/* Infos supplémentaires */}
        <div className="mt-6 bg-card rounded-3xl p-6 shadow-soft border border-border">
          <h3 className="font-heading font-bold text-foreground mb-4">
            Autres moyens de nous contacter
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Icon name="Mail" size={18} className="text-muted-foreground" />
              <a href="mailto:inbyoliver@gmail.com" className="text-primary hover:underline">
                inbyoliver@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Icon name="Globe" size={18} className="text-muted-foreground" />
              <a href="https://app.wooflyapp.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                app.wooflyapp.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
