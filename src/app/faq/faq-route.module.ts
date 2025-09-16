import { Route } from "@angular/router";
import { i18nBreadcrumbResolver } from "../core/breadcrumbs/i18n-breadcrumb.resolver";
import { FaqComponent } from "./faq.component";

export const ROUTES: Route[] = [
{
    path: '',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    component: FaqComponent,
    data: { title: 'showfaq.page.title', breadcrumbKey: 'showfaq.page' },
  },
]
