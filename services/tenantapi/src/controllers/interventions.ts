import { Collections } from '@microrealestate/common';
import { Request, Response } from 'express';
import { EmailNotification } from '@microrealestate/common';

export async function getInterventions(req: Request, res: Response) {
  let realmId: string;

  if (req.realm) {
    realmId = req.realm._id.toString();
  } else {
    const tenant = await Collections.Tenant.findOne({
      'contacts.email': req.user.email
    }).lean();

    if (!tenant || !tenant.realmId) {
      return res.status(400).json({ error: 'Tenant realm not found' });
    }

    realmId = tenant.realmId.toString();
  }

  const interventions = await Collections.Intervention
    .find({ realmId })
    .sort({ createdDate: -1 })
    .lean();
  res.json(interventions);
}

export async function getIntervention(req: Request, res: Response) {
  let realmId: string;

  if (req.realm) {
    realmId = req.realm._id.toString();
  } else {
    const tenant = await Collections.Tenant.findOne({
      'contacts.email': req.user.email
    }).lean();

    if (!tenant || !tenant.realmId) {
      return res.status(400).json({ error: 'Tenant realm not found' });
    }

    realmId = tenant.realmId.toString();
  }

  const { interventionId } = req.params;

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

export async function createIntervention(req: Request, res: Response) {
  let realmId: string;
  let tenant;

  if (req.realm) {
    realmId = req.realm._id.toString();
    tenant = await Collections.Tenant.findOne({
      'contacts.email': req.user.email
    }).lean();
  } else {
    tenant = await Collections.Tenant.findOne({
      'contacts.email': req.user.email
    }).lean();

    if (!tenant || !tenant.realmId) {
      return res.status(400).json({ error: 'Tenant realm not found' });
    }

    realmId = tenant.realmId.toString();
  }

  const { title, description, category, priority } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      error: 'Missing required fields: title, description'
    });
  }

  const tenantContact = tenant?.contacts?.[0];
  const tenantProperty = tenant?.properties?.[0];

  const intervention = new Collections.Intervention({
    realmId,
    tenantId: tenant?._id?.toString() || 'unknown',
    tenantName: tenant?.name || 'Unknown',
    tenantEmail: tenantContact?.email || req.user.email,
    tenantPhone: tenantContact?.phone || '',
    propertyId: tenantProperty?.propertyId || '',
    propertyName: tenantProperty?.property?.name || '',
    title,
    description,
    category: category || 'other',
    priority: priority || 'medium',
    status: 'pending',
    createdDate: new Date()
  });

  await intervention.save();

  // 📧 Envoyer les notifications email
  const interventionObj = intervention.toObject();
  const emailHeaders = {
    authorization: req.headers.authorization,
    organizationid: req.headers.organizationid || realmId,
    'accept-language': req.headers['accept-language'] || 'fr-FR'
  };

  // Email au locataire : confirmation de création
  await EmailNotification.notifyTenantInterventionCreated(
    interventionObj,
    emailHeaders
  );

  // Email au propriétaire : nouvelle demande
  const realm = await Collections.Realm.findOne({ _id: realmId }).lean();
  if (realm?.contacts?.[0]?.email) {
    await EmailNotification.notifyLandlordInterventionCreated(
      interventionObj,
      realm.contacts[0].email,
      emailHeaders
    );
  }

  res.status(201).json(interventionObj);
}

export async function addComment(req: Request, res: Response) {
  let realmId: string;

  if (req.realm) {
    realmId = req.realm._id.toString();
  } else {
    const tenant = await Collections.Tenant.findOne({
      'contacts.email': req.user.email
    }).lean();

    if (!tenant || !tenant.realmId) {
      return res.status(400).json({ error: 'Tenant realm not found' });
    }

    realmId = tenant.realmId.toString();
  }

  const { interventionId } = req.params;
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

  // 📧 Si c'est un commentaire du locataire, notifier le propriétaire
  if (authorRole === 'tenant') {
    const emailHeaders = {
      authorization: req.headers.authorization,
      organizationid: req.headers.organizationid || realmId,
      'accept-language': req.headers['accept-language'] || 'fr-FR'
    };

    const realm = await Collections.Realm.findOne({ _id: realmId }).lean();
    if (realm?.contacts?.[0]?.email) {
      await EmailNotification.notifyLandlordNewComment(
        intervention.toObject(),
        newComment,
        realm.contacts[0].email,
        emailHeaders
      );
    }
  }

  // Trier les commentaires par date décroissante
  if (intervention.comments && intervention.comments.length > 0) {
    intervention.comments.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  res.json(intervention.toObject());
}
