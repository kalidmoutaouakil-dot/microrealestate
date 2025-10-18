import { Collections, logger } from '@microrealestate/common';
import express from 'express';

const router = express.Router();

// GET - Liste des interventions
router.get('/', async (req, res) => {
  try {
    const realmId = req.realm._id;
    const { tenantId, status, limit = 50 } = req.query;

    const query: any = { realmId };
    
    if (tenantId) {
      query.tenantId = tenantId;
    }
    
    if (status) {
      query.status = status;
    }

    const interventions = await Collections.Intervention
      .find(query)
      .sort({ createdDate: -1 })
      .limit(Number(limit))
      .lean();

    res.json(interventions);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET - Une intervention spécifique
router.get('/:id', async (req, res) => {
  try {
    const realmId = req.realm._id;
    const interventionId = req.params.id;

    const intervention = await Collections.Intervention
      .findOne({ _id: interventionId, realmId })
      .lean();

    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    res.json(intervention);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST - Créer une nouvelle intervention
router.post('/', async (req, res) => {
  try {
    const realmId = req.realm._id;
    const {
      tenantId,
      tenantName,
      tenantEmail,
      tenantPhone,
      propertyId,
      propertyName,
      title,
      description,
      category,
      priority
    } = req.body;

    // Validation
    if (!tenantId || !title || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields: tenantId, title, description' 
      });
    }

    const intervention = new Collections.Intervention({
      realmId,
      tenantId,
      tenantName,
      tenantEmail,
      tenantPhone,
      propertyId,
      propertyName,
      title,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'pending',
      createdDate: new Date()
    });

    await intervention.save();

    // TODO: Envoyer une notification email au propriétaire

    res.status(201).json(intervention.toObject());
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH - Mettre à jour une intervention
router.patch('/:id', async (req, res) => {
  try {
    const realmId = req.realm._id;
    const interventionId = req.params.id;
    const updates = req.body;

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

    const filteredUpdates: any = {};
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

    res.json(intervention.toObject());
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST - Ajouter un commentaire
router.post('/:id/comments', async (req, res) => {
  try {
    const realmId = req.realm._id;
    const interventionId = req.params.id;
    const { authorId, authorName, authorRole, message } = req.body;

    if (!authorId || !authorName || !authorRole || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: authorId, authorName, authorRole, message' 
      });
    }

    const intervention = await Collections.Intervention.findOneAndUpdate(
      { _id: interventionId, realmId },
      {
        $push: {
          comments: {
            authorId,
            authorName,
            authorRole,
            message,
            date: new Date()
          }
        },
        $set: { updatedDate: new Date() }
      },
      { new: true }
    );

    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    // TODO: Envoyer une notification

    res.json(intervention.toObject());
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE - Supprimer une intervention (seulement si pending)
router.delete('/:id', async (req, res) => {
  try {
    const realmId = req.realm._id;
    const interventionId = req.params.id;

    const intervention = await Collections.Intervention.findOne({
      _id: interventionId,
      realmId
    });

    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    // Autoriser la suppression uniquement si pending
    if (intervention.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Can only delete pending interventions' 
      });
    }

    await intervention.deleteOne();

    res.json({ message: 'Intervention deleted successfully' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
