import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';
import Property from './property.js';

const InterventionSchema = new mongoose.Schema<CollectionTypes.Intervention>({
  // Organisation
  realmId: { type: String, ref: Realm },
  
  // Locataire
  tenantId: { type: String, required: true },
  tenantName: String,
  tenantEmail: String,
  tenantPhone: String,
  
  // Bien concerné
  propertyId: { type: String, ref: Property },
  propertyName: String,
  
  // Détails de l'intervention
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['plumbing', 'electricity', 'heating', 'lock', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Statut
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Dates
  createdDate: { type: Date, default: Date.now },
  scheduledDate: Date,
  completedDate: Date,
  
  // Pièces jointes
  attachments: [{
    _id: false,
    filename: String,
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  
  // Notes et commentaires
  comments: [{
    _id: false,
    authorId: String,
    authorName: String,
    authorRole: { type: String, enum: ['tenant', 'landlord'] },
    message: String,
    date: { type: Date, default: Date.now }
  }],
  
  // Informations sur l'intervention
  assignedTo: String, // Artisan/entreprise
  estimatedCost: Number,
  actualCost: Number,
  
  // Métadonnées
  updatedDate: { type: Date, default: Date.now }
});

// Index pour les requêtes fréquentes
InterventionSchema.index({ realmId: 1, tenantId: 1 });
InterventionSchema.index({ realmId: 1, status: 1 });
InterventionSchema.index({ createdDate: -1 });

// Middleware pour mettre à jour updatedDate
InterventionSchema.pre('save', function(next) {
  this.updatedDate = new Date();
  next();
});

export default mongoose.model<CollectionTypes.Intervention>('Intervention', InterventionSchema);
