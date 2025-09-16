import { combineLatest, map, Observable, of } from "rxjs";
import {  PartialMenuSection } from "../menu-provider.model";
import { AuthorizationDataService } from "src/app/core/data/feature-authorization/authorization-data.service";
import { FeatureID } from "src/app/core/data/feature-authorization/feature-id";
import { MenuItemType } from "../menu-item-type.model";
import { ScriptDataService } from "src/app/core/data/processes/script-data.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AbstractExpandableMenuProvider } from "./helper-providers/expandable-menu-provider";
import { Injectable } from "@angular/core";

/**
 * Menu provider to create the "Registries" menu (and subsections) in the admin sidebar
 */
@Injectable()
export class ReportPageMenuProvider extends AbstractExpandableMenuProvider {
      constructor(
        protected authorizationService: AuthorizationDataService,
        protected scriptDataService: ScriptDataService,
        protected modalService: NgbModal,
      ) {
        super();
      }
    
      public getTopSection(): Observable<PartialMenuSection> {
        return of(
          {
            model: {
              type: MenuItemType.TEXT,
              text: 'menu.section.reports',
            },
            icon: 'list',
            visible: true,
          },
        );
      }
    
      public getSubSections(): Observable<PartialMenuSection[]> {
        return combineLatest([
          this.authorizationService.isAuthorized(FeatureID.AdministratorOf),
        ]).pipe(
          map(([authorized]) => {
            return [
              {
            visible: authorized,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.audit_report',
              link: 'admin/custom-reports/audit-report',
            },
          },
            {
            visible: authorized,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.productivity_report',
              link: 'admin/custom-reports/productivity-report',
            },
          },
            ];
          }),
        );
      }

}
