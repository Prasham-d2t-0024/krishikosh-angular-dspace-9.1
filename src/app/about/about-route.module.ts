import { Route } from "@angular/router";
import { i18nBreadcrumbResolver } from "../core/breadcrumbs/i18n-breadcrumb.resolver";
import { AboutComponent } from "./about.component";

export const ROUTES: Route[] = [
{
    path: '',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    component: AboutComponent,
    data: { title: 'about.page.title', breadcrumbKey: 'about.page' },
  },
]
