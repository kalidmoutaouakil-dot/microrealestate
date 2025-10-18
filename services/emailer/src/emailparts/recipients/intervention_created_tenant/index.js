export async function get(organizationId, templateName, recordId, params, data) {
  return [
    {
      to: params.tenantEmail
    }
  ];
}
