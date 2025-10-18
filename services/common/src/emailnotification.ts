import axios from 'axios';

const EMAILER_URL = process.env.EMAILER_URL || 'http://emailer:8400';

interface Intervention {
  _id: string;
  realmId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  propertyId: string;
  propertyName: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdDate: Date | string;
  updatedDate?: Date | string;
  comments?: Comment[];
}

interface Comment {
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  date: Date | string;
}

interface EmailHeaders {
  authorization?: string;
  organizationid?: string | string[];
  'accept-language'?: string;
}

/**
 * Normalise l'organizationId qui peut être string ou string[]
 */
function normalizeOrgId(orgId?: string | string[]): string | undefined {
  if (Array.isArray(orgId)) {
    return orgId[0];
  }
  return orgId;
}

/**
 * Envoie une notification email au locataire lors de la création d'une intervention
 */
export async function notifyTenantInterventionCreated(
  intervention: Intervention,
  headers: EmailHeaders
): Promise<void> {
  try {
    const emailData = {
      templateName: 'intervention_created_tenant',
      recordId: intervention._id,
      params: {
        tenantName: intervention.tenantName,
        tenantEmail: intervention.tenantEmail,
        title: intervention.title,
        description: intervention.description,
        category: getCategoryLabel(intervention.category),
        priority: getPriorityLabel(intervention.priority),
        propertyName: intervention.propertyName,
        createdDate: new Date(intervention.createdDate).toLocaleString('fr-FR')
      }
    };

    await axios.post(EMAILER_URL, emailData, {
      headers: {
        authorization: headers.authorization,
        organizationid: normalizeOrgId(headers.organizationid),
        'Accept-Language': headers['accept-language'] || 'fr-FR'
      }
    });
    console.log(`✅ Email envoyé au locataire: ${intervention.tenantEmail}`);
  } catch (error: any) {
    console.error('❌ Erreur envoi email au locataire:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

/**
 * Envoie une notification email au propriétaire lors de la création d'une intervention
 */
export async function notifyLandlordInterventionCreated(
  intervention: Intervention,
  landlordEmail: string,
  headers: EmailHeaders
): Promise<void> {
  try {
    const emailData = {
      templateName: 'intervention_created_landlord',
      recordId: intervention._id,
      params: {
        realmId: intervention.realmId,
        landlordEmail,
        tenantName: intervention.tenantName,
        tenantEmail: intervention.tenantEmail,
        tenantPhone: intervention.tenantPhone || 'Non renseigné',
        title: intervention.title,
        description: intervention.description,
        category: getCategoryLabel(intervention.category),
        priority: getPriorityLabel(intervention.priority),
        propertyName: intervention.propertyName,
        createdDate: new Date(intervention.createdDate).toLocaleString('fr-FR')
      }
    };

    await axios.post(EMAILER_URL, emailData, {
      headers: {
        authorization: headers.authorization,
        organizationid: normalizeOrgId(headers.organizationid),
        'Accept-Language': headers['accept-language'] || 'fr-FR'
      }
    });
    console.log(`✅ Email envoyé au propriétaire: ${landlordEmail}`);
  } catch (error: any) {
    console.error('❌ Erreur envoi email au propriétaire:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

/**
 * Envoie une notification email au locataire lors du changement de statut
 */
export async function notifyTenantStatusChanged(
  intervention: Intervention,
  oldStatus: string,
  newStatus: string,
  headers: EmailHeaders
): Promise<void> {
  try {
    let subject = '';
    let message = '';

    switch (newStatus) {
      case 'in_progress':
        subject = '🔧 Votre demande est en cours de traitement';
        message = 'Votre demande d\'intervention a été prise en charge par le propriétaire. Vous pouvez suivre son avancement dans votre espace locataire.';
        break;
      case 'completed':
        subject = '✅ Votre demande a été traitée';
        message = 'Votre demande d\'intervention a été traitée avec succès. Si vous avez des questions, n\'hésitez pas à nous contacter.';
        break;
      case 'rejected':
        subject = '❌ Votre demande a été refusée';
        message = 'Votre demande d\'intervention a été refusée. Pour plus d\'informations, consultez les commentaires du propriétaire dans votre espace locataire.';
        break;
      default:
        return;
    }

    const emailData = {
      templateName: 'intervention_status_changed',
      recordId: intervention._id,
      params: {
        realmId: intervention.realmId,
        tenantName: intervention.tenantName,
        tenantEmail: intervention.tenantEmail,
        subject,
        message,
        title: intervention.title,
        propertyName: intervention.propertyName,
        oldStatus: getStatusLabel(oldStatus),
        newStatus: getStatusLabel(newStatus),
        updatedDate: new Date().toLocaleString('fr-FR')
      }
    };
    console.log('🔍 Envoi email avec templateName:', emailData.templateName);
    console.log('🔍 URL:', EMAILER_URL);
    await axios.post(EMAILER_URL, emailData, {
      headers: {
        authorization: headers.authorization,
        organizationid: normalizeOrgId(headers.organizationid),
        'Accept-Language': headers['accept-language'] || 'fr-FR'
      }
    });
    console.log(`✅ Email statut envoyé au locataire: ${intervention.tenantEmail}`);
  } catch (error: any) {
    console.error('❌ Erreur envoi email changement statut:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

/**
 * Envoie une notification email au propriétaire lors de l'ajout d'un commentaire par le locataire
 */
export async function notifyLandlordNewComment(
  intervention: Intervention,
  comment: Comment,
  landlordEmail: string,
  headers: EmailHeaders
): Promise<void> {
  try {
    const emailData = {
      templateName: 'intervention_comment_added',
      recordId: intervention._id,
      params: {
        landlordEmail,
        tenantName: intervention.tenantName,
        propertyName: intervention.propertyName,
        title: intervention.title,
        commentAuthor: comment.authorName,
        commentMessage: comment.message,
        commentDate: new Date(comment.date).toLocaleString('fr-FR')
      }
    };

    await axios.post(EMAILER_URL, emailData, {
      headers: {
        authorization: headers.authorization,
        organizationid: normalizeOrgId(headers.organizationid),
        'Accept-Language': headers['accept-language'] || 'fr-FR'
      }
    });
    console.log(`✅ Email commentaire envoyé au propriétaire: ${landlordEmail}`);
  } catch (error: any) {
    console.error('❌ Erreur envoi email commentaire:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

/**
 * Envoie une notification email au locataire lors de l'ajout d'un commentaire par le propriétaire
 */
export async function notifyTenantNewComment(
  intervention: Intervention,
  comment: Comment,
  headers: EmailHeaders
): Promise<void> {
  try {
    const emailData = {
      templateName: 'intervention_comment_landlord',
      recordId: intervention._id,
      params: {
        realmId: intervention.realmId,
        tenantName: intervention.tenantName,
        tenantEmail: intervention.tenantEmail,
        propertyName: intervention.propertyName,
        title: intervention.title,
        commentAuthor: comment.authorName,
        commentMessage: comment.message,
        commentDate: new Date(comment.date).toLocaleString('fr-FR')
      }
    };

    await axios.post(EMAILER_URL, emailData, {
      headers: {
        authorization: headers.authorization,
        organizationid: normalizeOrgId(headers.organizationid),
        'Accept-Language': headers['accept-language'] || 'fr-FR'
      }
    });
    console.log(`✅ Email commentaire propriétaire envoyé au locataire: ${intervention.tenantEmail}`);
  } catch (error: any) {
    console.error('❌ Erreur envoi email commentaire propriétaire:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Helpers pour les labels
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    plumbing: 'Plomberie',
    electricity: 'Électricité',
    heating: 'Chauffage',
    lock: 'Serrurerie',
    other: 'Autre'
  };
  return labels[category] || category;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente'
  };
  return labels[priority] || priority;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminée',
    rejected: 'Refusée'
  };
  return labels[status] || status;
}
