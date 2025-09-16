import { getAdminModuleRoute } from '../app-routing-paths';
import { URLCombiner } from '../core/url-combiner/url-combiner';
import { getQualityAssuranceEditRoute } from './admin-notifications/admin-notifications-routing-paths';

export const REGISTRIES_MODULE_PATH = 'registries';
export const NOTIFICATIONS_MODULE_PATH = 'notifications';
export const LDN_PATH = 'ldn';
export const REPORTS_MODULE_PATH = 'reports';
export const NOTIFY_DASHBOARD_MODULE_PATH = 'notify-dashboard';
export const CUSTOM_REPORTS_MODULE_PATH = 'custom-reports';


export function getRegistriesModuleRoute() {
  return new URLCombiner(getAdminModuleRoute(), REGISTRIES_MODULE_PATH).toString();
}

export function getLdnServicesModuleRoute() {
  return new URLCombiner(getAdminModuleRoute(), LDN_PATH).toString();
}

export function getNotificationsModuleRoute() {
  return new URLCombiner(getAdminModuleRoute(), NOTIFICATIONS_MODULE_PATH).toString();
}

export function getNotificatioQualityAssuranceRoute() {
  return new URLCombiner(`/${NOTIFICATIONS_MODULE_PATH}`, getQualityAssuranceEditRoute()).toString();
}

export function getReportsModuleRoute() {
  return new URLCombiner(getAdminModuleRoute(), REPORTS_MODULE_PATH).toString();
}

export function getCustomReportModuleRoute() {
  console.log('getCustomReportModuleRoute called',new URLCombiner(getAdminModuleRoute(), CUSTOM_REPORTS_MODULE_PATH).toString());
  return new URLCombiner(getAdminModuleRoute(), CUSTOM_REPORTS_MODULE_PATH).toString();
}
