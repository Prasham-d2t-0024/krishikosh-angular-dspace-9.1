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
export class FaqPageMenu extends AbstractMenuProvider {
     public getSections(): Observable<PartialMenuSection[]> {
    return of([
      {
        visible: true,
        model: {
          type: MenuItemType.LINK,
          text: `menu.section.faq`,
          link: `/faqs`,
        },
        icon: 'diagram-project',
      },
    ] as PartialMenuSection[]);
  }
}
