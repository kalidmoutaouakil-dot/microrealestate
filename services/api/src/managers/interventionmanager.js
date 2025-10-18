import { Collections } from '@microrealestate/common';
import { EmailNotification } from '@microrealestate/common';

export async function all(req, res) {
  const realmId = req.realm._id.toString();

  const interventions = await Collections.Intervention.find({ realmId })
    .sort({ createdDate: -1 })
    .lean();

  res.json(interventions);
}

export async function one(req, res) {
  const realmId = req.realm._id.toString();
  const interventionId = req.params.id;

  const intervention = await Collections.Intervention
    .findOne({ _id: interventionId, realmId })
    .lean();

  if (!intervention) {
    return res.status(404).json({ error: 'Intervention not found' });
  }

  // Trier les commentaires par date décroissante
  if (intervention.comments && intervention.comments.length > 0) {
    intervention.comments.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  res.json(intervention);
}

export async function update(req, res) {
  const realmId = req.realm._id.toString();
  const interventionId = req.params.id;
  const updates = req.body;

  // Récupérer l'intervention actuelle pour comparer le statut
  const currentIntervention = await Collections.Intervention.findOne({
    _id: interventionId,
    realmId
  });

  if (!currentIntervention) {
    return res.status(404).json({ error: 'Intervention not found' });
  }

  const oldStatus = currentIntervention.status;

  // Champs autorisés à la mise à jour
  const allowedFields = [
    'status',
    'priority',
    'scheduledDate',
    'completedDate',
    'assignedTo',
    'estimatedCost',
    'actualCost'
  ];

  const filteredUpdates = {};
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  filteredUpdates.updatedDate = new Date();

  const intervention = await Collections.Intervention.findOneAndUpdate(
    { _id: interventionId, realmId },
    { $set: filteredUpdates },
    { new: true }
  );

  if (!intervention) {
    return res.status(404).json({ error: 'Intervention not found' });
  }

  // 📧 Si le statut a changé, notifier le locataire
  const newStatus = intervention.status;
  if (oldStatus !== newStatus && ['in_progress', 'completed', 'rejected'].includes(newStatus)) {
    const emailHeaders = {
      authorization: req.headers.authorization,
      organizationid: req.headers.organizationid || realmId,
      'accept-language': req.headers['accept-language'] || 'fr-FR'
    };

    await EmailNotification.notifyTenantStatusChanged(
      intervention.toObject(),
      oldStatus,
      newStatus,
      emailHeaders
    );
  }

  res.json(intervention.toObject());
}

export async function addComment(req, res) {
  const realmId = req.realm._id.toString();
  const interventionId = req.params.id;
  const { authorId, authorName, authorRole, message } = req.body;

  if (!authorId || !authorName || !authorRole || !message) {
    return res.status(400).json({
      error: 'Missing required fields: authorId, authorName, authorRole, message'
    });
  }

  const newComment = {
    authorId,
    authorName,
    authorRole,
    message,
    date: new Date()
  };

  const intervention = await Collections.Intervention.findOneAndUpdate(
    { _id: interventionId, realmId },
    {
      $push: {
        comments: newComment
      },
      $set: { updatedDate: new Date() }
    },
    { new: true }
  );

  if (!intervention) {
    return res.status(404).json({ error: 'Intervention not found' });
  }

  // 📧 Si c'est un commentaire du propriétaire, notifier le locataire
  if (authorRole === 'landlord') {
    const emailHeaders = {
      authorization: req.headers.authorization,
      organizationid: req.headers.organizationid || realmId,
      'accept-language': req.headers['accept-language'] || 'fr-FR'
    };

    await EmailNotification.notifyTenantNewComment(
      intervention.toObject(),
      newComment,
      emailHeaders
    );
  }

  // Trier les commentaires par date décroissante
  if (intervention.comments && intervention.comments.length > 0) {
    intervention.comments.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  res.json(intervention.toObject());
}

export async function remove(req, res) {
  const realmId = req.realm._id.toString();
  const interventionId = req.params.id;

  const result = await Collections.Intervention.deleteOne({
    _id: interventionId,
    realmId
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Intervention not found' });
  }

  res.status(204).send();
}
