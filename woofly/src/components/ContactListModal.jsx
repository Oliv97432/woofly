import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Phone, MapPin, Home, Heart, Users, Dog } from 'lucide-react';

const ContactListModal = ({ isOpen, onClose, title, items, type }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleItemClick = (item) => {
    onClose();
    if (type === 'dogs') {
      navigate(`/pro/dogs/${item.id}`);
    } else {
      navigate(`/pro/crm/contacts/${item.id}`);
    }
  };

  const getTypeIcon = (contactType) => {
    if (contactType === 'foster_family' || contactType === 'both') return Home;
    if (contactType === 'adopter') return Heart;
    return Users;
  };

  const getTypeLabel = (contactType) => {
    switch (contactType) {
      case 'foster_family': return 'Famille d\'accueil';
      case 'adopter': return 'Adoptant';
      case 'both': return 'FA & Adoptant';
      default: return 'Contact';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition-smooth"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Aucun élément à afficher</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {type === 'dogs' ? (
                // Liste de chiens
                items.map((dog) => (
                  <button
                    key={dog.id}
                    onClick={() => handleItemClick(dog)}
                    className="w-full p-4 hover:bg-muted/50 transition-smooth text-left flex items-center gap-4 group"
                  >
                    {dog.photo_url ? (
                      <img
                        src={dog.photo_url}
                        alt={dog.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <Dog size={32} className="text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {dog.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {dog.breed || 'Race non précisée'}
                      </p>
                      {dog.foster_family_name && (
                        <div className="flex items-center gap-1 text-xs text-purple-600">
                          <Home size={12} />
                          <span>Chez {dog.foster_family_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      →
                    </div>
                  </button>
                ))
              ) : (
                // Liste de contacts
                items.map((contact) => {
                  const TypeIcon = getTypeIcon(contact.type);
                  
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleItemClick(contact)}
                      className="w-full p-4 hover:bg-muted/50 transition-smooth text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                          <TypeIcon size={24} className="text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                              {contact.full_name}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {getTypeLabel(contact.type)}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail size={14} className="flex-shrink-0" />
                                <span className="truncate">{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone size={14} className="flex-shrink-0" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {contact.city && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin size={14} className="flex-shrink-0" />
                                <span className="truncate">{contact.city}</span>
                              </div>
                            )}
                          </div>

                          {(contact.type === 'foster_family' || contact.type === 'both') && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-purple-600 font-medium">
                                {contact.current_dogs_count || 0}/{contact.max_dogs || 0} chiens
                              </span>
                              {contact.availability === 'available' && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  Disponible
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-muted-foreground flex-shrink-0">
                          →
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer avec nombre d'éléments */}
        <div className="bg-muted/30 px-6 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            {items.length} {type === 'dogs' ? 'chien' : 'contact'}{items.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactListModal;
