import { Collections } from '@microrealestate/common';

export async function get(recordId, params) {
  console.log('✅ Data loader intervention_status_changed appelé !');
  console.log('  recordId:', recordId);
  console.log('  params:', JSON.stringify(params, null, 2));
  
  // Charger les infos du landlord (realm) depuis MongoDB
  const landlord = await Collections.Realm.findOne({ _id: params.realmId }).lean();
  
  const result = {
    email: params.tenantEmail,
    landlord: landlord,  // ← Les infos du landlord avec la config Mailgun
    ...params
  };
  
  console.log('📧 Landlord loaded:', landlord ? 'Yes' : 'No');
  console.log('📧 Has Mailgun config:', landlord?.thirdParties?.mailgun ? 'Yes' : 'No');
  
  return result;
}
