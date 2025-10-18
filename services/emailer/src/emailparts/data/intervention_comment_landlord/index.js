import { Collections } from '@microrealestate/common';

export async function get(recordId, params) {
  console.log('✅ Data loader intervention_status_changed appelé !');
  console.log('  recordId:', recordId);
  console.log('  params:', JSON.stringify(params, null, 2));
  
  // Charger les infos du landlord (realm) depuis MongoDB
  const realm = await Collections.Realm.findOne({ _id: params.realmId || recordId }).lean();
  
  const result = {
    email: params.tenantEmail,
    landlord: realm,  // ← Ajouter les infos du landlord
    ...params
  };
  
  console.log('📧 Returning email:', result.email);
  console.log('📧 Full result:', JSON.stringify(result, null, 2));
  
  return result;
}
