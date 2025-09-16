import { Route } from '@angular/router';

import { i18nBreadcrumbResolver } from '../../core/breadcrumbs/i18n-breadcrumb.resolver';
import { BITSTREAMFORMATS_MODULE_PATH } from './admin-registries-routing-paths';
import { MetadataRegistryComponent } from './metadata-registry/metadata-registry.component';
import { MetadataSchemaComponent } from './metadata-schema/metadata-schema.component';
import { CreateCutomPagesComponent } from './create-cutom-pages/create-cutom-pages.component';
import { CreateFAQsComponent } from './create-faqs/create-faqs.component';

export const ROUTES: Route[] = [
  {
    path: 'metadata',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { title: 'admin.registries.metadata.title', breadcrumbKey: 'admin.registries.metadata' },
    children: [
      {
        path: '',
        component: MetadataRegistryComponent,
      },
      {
        path: ':schemaName',
        resolve: { breadcrumb: i18nBreadcrumbResolver },
        component: MetadataSchemaComponent,
        data: { title: 'admin.registries.schema.title', breadcrumbKey: 'admin.registries.schema' },
      },
    ],
  },
  {
    path: BITSTREAMFORMATS_MODULE_PATH,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    loadChildren: () => import('./bitstream-formats/bitstream-formats-routes')
      .then((m) => m.ROUTES),
    data: { title: 'admin.registries.bitstream-formats.title', breadcrumbKey: 'admin.registries.bitstream-formats' },
  },
  {
    path: 'custom_pages',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { title: 'Custom Page(s)', breadcrumbKey: 'custompage' },
    children: [
      {
        path: '',
        component: CreateCutomPagesComponent
      }
    ]
  },
   {
    path: 'faq',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { title: 'Create FaQ(s)', breadcrumbKey: 'create.faq.page' },
    children: [
      {
        path: '',
        component: CreateFAQsComponent
      }
    ]
  },
];
