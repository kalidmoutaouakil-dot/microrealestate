import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getDb } from '@microrealestate/common';
import { ObjectId } from 'mongodb';
import fs from 'fs';

const s3 = new S3Client({
  region: 'eu-central-003',
  endpoint: 'https://s3.eu-central-003.backblazeb2.com',
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

export async function uploadPropertyImage(req, res) {
  try {
    const propertyId = req.params.propertyId;
    const file = req.files?.file;
    if (!file) return res.status(400).json({ error: 'Aucun fichier reçu' });

    const fileName = `${propertyId}_${Date.now()}_${file.name}`;
    const uploadPath = file.tempFilePath;

    // Upload vers Backblaze
    const uploadParams = {
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileName,
      Body: fs.createReadStream(uploadPath),
      ContentType: file.mimetype,
    };
    await s3.send(new PutObjectCommand(uploadParams));

    const fileUrl = `${process.env.B2_BUCKET_URL}/${fileName}`;

    // Stocker l’URL dans MongoDB
    const db = await getDb();
    await db.collection('properties').updateOne(
      { _id: new ObjectId(propertyId) },
      { $push: { images: { url: fileUrl, uploadedAt: new Date() } } }
    );

    return res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur upload image' });
  }
}
