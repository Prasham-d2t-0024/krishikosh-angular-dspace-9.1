import { i18nBreadcrumbResolver } from "src/app/core/breadcrumbs/i18n-breadcrumb.resolver";
import { AuditReportComponent } from "./audit-report/audit-report.component";
import { ProductivityReportComponent } from "./productivity-report/productivity-report.component";
import { Route } from "@angular/router";

export const ROUTES: Route[] = [
{
    path: 'audit-report',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { title: 'Audit Report', breadcrumbKey: 'audit.report.page' },
    children: [
      {
        path: '',
        component: AuditReportComponent
      }
    ]
  },
  {
      path: 'productivity-report',
      resolve: { breadcrumb: i18nBreadcrumbResolver },
      data: { title: 'Productivity Report', breadcrumbKey: 'productivity.report.page' },
      children: [
        {
          path: '',
          component: ProductivityReportComponent
        }
      ]
    },
]