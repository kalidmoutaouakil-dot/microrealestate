import * as Invoice from '../invoice/index.js';
import moment from 'moment';

function _avoidWeekend(aMoment) {
  const day = aMoment.isoWeekday();
  if (day === 6) {
    // if saturday shift the due date to friday
    aMoment.subtract(1, 'days');
  } else if (day === 7) {
    // if sunday shift the due date to monday
    aMoment.add(1, 'days');
  }
  return aMoment;
}

export async function get(tenantId, params) {
  const momentTerm = moment(params.term, 'YYYYMMDDHH');
  const momentToday = moment();
  const { landlord, tenant, period } = await Invoice.get(tenantId, params);
  const beginDate = moment(tenant.contract.beginDate);
  
  // Récupérer dueDateDay du lease (valeur par défaut: 1)
  const dueDateDay = tenant.contract.lease.dueDateDay || 1;
  const timeRange = tenant.contract.lease.timeRange;
  
  let dueDate = moment(momentTerm);
  
  if (timeRange === 'years') {
    dueDate.add(1, 'months');
    dueDate.date(dueDateDay); // Utiliser dueDateDay au lieu de +10 jours
  } else if (timeRange === 'months') {
    dueDate.date(dueDateDay); // Utiliser dueDateDay au lieu de +10 jours
  } else if (timeRange === 'weeks') {
    dueDate.add(2, 'days');
  }
  
  _avoidWeekend(dueDate);
  
  if (dueDate.isBefore(beginDate)) {
    dueDate = moment(beginDate);
  }

  let billingDay = momentToday;
  if (dueDate.isSameOrBefore(momentToday)) {
    billingDay = _avoidWeekend(moment(momentTerm));
  }

  // data that will be injected in the email content files (ejs files)
  return {
    landlord,
    tenant,
    period,
    today: billingDay.format('DD/MM/YYYY'),
    billingRef: `${moment(params.term, 'YYYYMMDDHH').format('MM_YY')}_${
      tenant.reference
    }`,
    dueDate: dueDate.format('DD/MM/YYYY')
  };
}
