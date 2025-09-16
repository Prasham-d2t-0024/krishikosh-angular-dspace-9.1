import { AsyncPipe, CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { BehaviorSubject, Observable, combineLatest as observableCombineLatest } from 'rxjs';
import { filter, map, mergeMap, switchMap } from 'rxjs/operators';

import { RemoteData } from '../../../core/data/remote-data';
import { Community } from '../../../core/shared/community.model';
import { ThemedCollectionPageSubCollectionListComponent } from './sub-collection-list/themed-community-page-sub-collection-list.component';
import { ThemedCommunityPageSubCommunityListComponent } from './sub-community-list/themed-community-page-sub-community-list.component';
import { DSpaceObject } from 'src/app/core/shared/dspace-object.model';
import { hasValue } from 'src/app/shared/empty.util';
import { followLink, FollowLinkConfig } from 'src/app/shared/utils/follow-link-config.model';
import { getFirstSucceededRemoteData } from 'src/app/core/shared/operators';
import { Collection } from '../../../core/shared/collection.model';
import { Bitstream } from 'src/app/core/shared/bitstream.model';
import { DSpaceObjectDataService } from 'src/app/core/data/dspace-object-data.service';
import { DSONameService } from 'src/app/core/breadcrumbs/dso-name.service';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DsoEditMenuComponent } from 'src/app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { ComcolPageBrowseByComponent } from 'src/app/shared/comcol/comcol-page-browse-by/comcol-page-browse-by.component';
import { ComcolPageLogoComponent } from 'src/app/shared/comcol/comcol-page-logo/comcol-page-logo.component';
import { ThemedComcolPageContentComponent } from 'src/app/shared/comcol/comcol-page-content/themed-comcol-page-content.component';
import { ComcolPageHandleComponent } from 'src/app/shared/comcol/comcol-page-handle/comcol-page-handle.component';
import { ComcolPageHeaderComponent } from 'src/app/shared/comcol/comcol-page-header/comcol-page-header.component';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { PaginationComponentOptions } from 'src/app/shared/pagination/pagination-component-options.model';
import { SortDirection, SortOptions } from 'src/app/core/cache/models/sort-options.model';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { CommunityDataService } from 'src/app/core/data/community-data.service';
import { PaginationService } from '../../../core/pagination/pagination.service';
import { ErrorComponent } from 'src/app/shared/error/error.component';
import { ObjectCollectionComponent } from 'src/app/shared/object-collection/object-collection.component';
import { ThemedLoadingComponent } from 'src/app/shared/loading/themed-loading.component';
import { VarDirective } from 'src/app/shared/utils/var.directive';
import { HomePageComponent } from 'src/app/home-page/home-page.component';
import { HomeTrandingCollectionsComponent } from 'src/app/home-page/home-tranding-collections/home-tranding-collections.component';
import { HomeTrandingTypesComponent } from 'src/app/home-page/home-tranding-types/home-tranding-types.component';
import { HomeTrendingItemComponent } from 'src/app/home-page/home-trending-item/home-trending-item.component';
import { HomeTrandingGeolocationComponent } from 'src/app/home-page/home-tranding-geolocation/home-tranding-geolocation.component';

@Component({
  selector: 'ds-sub-com-col-section',
  templateUrl: './sub-com-col-section.component.html',
  styleUrls: ['./sub-com-col-section.component.scss'],
  imports: [
    AsyncPipe,
    ThemedCollectionPageSubCollectionListComponent,
    ThemedCommunityPageSubCommunityListComponent,
    NgbNavModule,
    CommonModule,
    DsoEditMenuComponent,
    ComcolPageBrowseByComponent,
    ComcolPageLogoComponent,
    ThemedComcolPageContentComponent,
    ComcolPageHandleComponent,
    ComcolPageHeaderComponent,
    TranslatePipe,
    ErrorComponent,
    ObjectCollectionComponent,
    ThemedLoadingComponent,
    TranslateModule,
    VarDirective,
    HomeTrendingItemComponent,
    HomeTrandingGeolocationComponent,
    HomeTrandingCollectionsComponent,
    HomeTrandingTypesComponent,
  ],
  standalone: true,
})
export class SubComColSectionComponent implements OnInit {

  parent$: Observable<RemoteData<DSpaceObject>>;
  logoRD$: Observable<RemoteData<Bitstream>>;
    /**
   * The pagination configuration
   */
  config: PaginationComponentOptions;

  /**
   * The pagination id
   */
  pageId = 'cmscm';

  /**
   * The sorting configuration
   */
  sortConfig: SortOptions;

  /**
   * A list of remote data objects of communities' collections
   */
  subCommunitiesRDObs: BehaviorSubject<RemoteData<PaginatedList<Community>>> = new BehaviorSubject<RemoteData<PaginatedList<Community>>>({} as any);

  totalCommunityElements: number = 1;

  @ViewChild('communityTab') communityTab: ElementRef;

  @ViewChild('collectionTab') collectionTab: ElementRef;

  parentId:string;
  constructor(private route: ActivatedRoute,
    private _router: Router,
    protected dsoService: DSpaceObjectDataService,
    public dsoNameService: DSONameService,
    public cds: CommunityDataService,
    public paginationService: PaginationService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit(): void {
    this._router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        view: 'grid'
      },
      queryParamsHandling: 'merge',
      // preserve the existing query params in the route
      skipLocationChange: true
      // do not trigger navigation
    });
    this.route.paramMap.subscribe(params => {
      const paramValue = params.get('id');
      this.updateParent(paramValue);
      this.updateLogo();
    });
    this.initPage();
  }

  /**
   * Update the parent Community or Collection using their scope
   * @param scope   The UUID of the Community or Collection to fetch
   */
  updateParent(scope: string) {
    if (hasValue(scope)) {
      const linksToFollow = () => {
        return [followLink('logo')];
      };
      this.parent$ = this.dsoService.findById(scope,
        true,
        true,
        ...linksToFollow() as FollowLinkConfig<DSpaceObject>[]).pipe(
          getFirstSucceededRemoteData()
        );
    }
  }

  /**
   * Update the parent Community or Collection logo
   */
  updateLogo() {
    if (hasValue(this.parent$)) {
      this.logoRD$ = this.parent$.pipe(
        map((rd: RemoteData<Collection | Community>) => rd.payload),
        filter((collectionOrCommunity: Collection | Community) => hasValue(collectionOrCommunity.logo)),
        mergeMap((collectionOrCommunity: Collection | Community) => collectionOrCommunity.logo)
      );
    }
  }

   initPage() {
    this.config = new PaginationComponentOptions();
    this.config.id = this.pageId;
    this.config.pageSize = this.route.snapshot.queryParams[this.pageId + '.rpp'] ?? this.config.pageSize;
    this.config.currentPage = this.route.snapshot.queryParams[this.pageId + '.page'] ?? 1;
    this.sortConfig = new SortOptions('dc.title', SortDirection[this.route.snapshot.queryParams[this.pageId + '.sd']] ?? SortDirection.ASC);
    const pagination$ = this.paginationService.getCurrentPagination(this.config.id, this.config);
    const sort$ = this.paginationService.getCurrentSort(this.config.id, this.sortConfig);
    let parentContextId;
    this.parent$.subscribe(parentRD => {
      if (parentRD?.payload) {
        parentContextId = parentRD?.payload?.id;
        this.parentId = parentRD?.payload?.id;
        observableCombineLatest([pagination$, sort$]).pipe(
          switchMap(([currentPagination, currentSort]) => {
            return this.cds.findByParent(parentContextId, {
              currentPage: currentPagination.currentPage,
              elementsPerPage: currentPagination.pageSize,
              sort: { field: currentSort.field, direction: currentSort.direction }
            });
          })
        ).subscribe((results) => {
          this.subCommunitiesRDObs.next(results);
          this.totalCommunityElements = results.payload?.totalElements;
        })
      }
    });
  }

    ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
          if (this.totalCommunityElements > 0 && this.communityTab) {
            this.communityTab.nativeElement.click();
          } else if (this.collectionTab) {
            this.collectionTab.nativeElement.click();
          }
        }, 300);
    }
  }

}

