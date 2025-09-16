import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { catchError, combineLatest, map, Observable, of } from "rxjs";
import { AbstractMenuProvider, PartialMenuSection } from "../menu-provider.model";
import { MenuItemType } from "../menu-item-type.model";
import { AbstractExpandableMenuProvider } from "./helper-providers/expandable-menu-provider";
import { TextMenuItemModel } from "../menu-item/models/text.model";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "src/config/app-config.interface";
import { BrowseService } from "src/app/core/browse/browse.service";
import { getFirstSucceededRemoteData } from "src/app/core/shared/operators";
import { RemoteData } from "src/app/core/data/remote-data";
import { PaginatedList } from "src/app/core/data/paginated-list.model";
import { BrowseDefinition } from "src/app/core/shared/browse-definition.model";
import { ChartService } from "src/app/core/shared/trending-charts/chart.service";

/**
 * Menu provider to create the "Custom Pages" browse menu sections in the public navbar
 */
@Injectable()
export class CustomPageMenu extends AbstractExpandableMenuProvider {
     constructor(
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
    protected browseService: BrowseService,
    protected chartService: ChartService
  ) {
    super();
  }
     getTopSection() {
       return of(
         {
           model: {
             type: MenuItemType.TEXT,
             text: 'menu.section.custompages',
           } as TextMenuItemModel,
           icon: 'globe',
           visible: true,
         },
       );
     }
   
     /**
      * Retrieves subsections by fetching the browse definitions from the backend and mapping them to partial menu sections.
      */
  getSubSections() {
    return this.chartService.getDynamicPagesMenu().pipe(
      catchError((err) => {
        console.error('Error loading dynamic pages menu:', err);
        return of([]); // fallback empty menu
      }),
      map((rd: any) => {
        const pageMasters = rd?._embedded?.pagemasters ?? [];  // null-safe

        return pageMasters.map((browseDef: any) => ({
          visible: true,
          model: {
            type: MenuItemType.LINK,
            text: browseDef.mastername,
            link: `/aboutus/${browseDef.mastername}`,
          },
        }));
      })
    );
  }

}
