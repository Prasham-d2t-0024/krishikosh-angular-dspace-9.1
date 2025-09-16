import { AsyncPipe, CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  NgbModal,
  NgbModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import { DSpaceObjectDataService } from '../../core/data/dspace-object-data.service';
import { PaginationService } from '../../core/pagination/pagination.service';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { getFirstSucceededRemoteDataPayload } from '../../core/shared/operators';
import { SearchService } from '../../core/shared/search/search.service';
import { SearchConfigurationService } from '../../core/shared/search/search-configuration.service';
import { SearchFilterService } from '../../core/shared/search/search-filter.service';
import {
  hasValue,
  isNotEmpty,
} from '../empty.util';
import { BrowserOnlyPipe } from '../utils/browser-only.pipe';
import { currentPath } from '../utils/route.utils';
import { ScopeSelectorModalComponent } from './scope-selector-modal/scope-selector-modal.component';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { Community } from 'src/app/core/shared/community.model';
import { PaginationComponentOptions } from '../pagination/pagination-component-options.model';
import { SortDirection, SortOptions } from 'src/app/core/cache/models/sort-options.model';
import { combineLatest as observableCombineLatest } from 'rxjs';
import { CommunityDataService } from 'src/app/core/data/community-data.service';
import { FollowLinkConfig } from '../utils/follow-link-config.model';

@Component({
  selector: 'ds-base-search-form',
  styleUrls: ['./search-form.component.scss'],
  templateUrl: './search-form.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    BrowserOnlyPipe,
    FormsModule,
    NgbTooltipModule,
    TranslateModule,
    CommonModule,
    NgbModule
  ],
})
/**
 * Component that represents the search form
 */
export class SearchFormComponent implements OnChanges,OnInit {
  /**
   * The search query
   */
  @Input() query: string;

  /**
   * True when the search component should show results on the current page
   */
  @Input() inPlaceSearch: boolean;

  /**
   * The currently selected scope object's UUID
   */
  @Input()
  scope = '';

  /**
   * Hides the scope in the url, this can be useful when you hardcode the scope in another way
   */
  @Input() hideScopeInUrl = false;

  selectedScope: BehaviorSubject<DSpaceObject> = new BehaviorSubject<DSpaceObject>(undefined);

  @Input() currentUrl: string;

  /**
   * Whether or not the search button should be displayed large
   */
  @Input() large = false;

  /**
   * The brand color of the search button
   */
  @Input() brandColor = 'primary';

  /**
   * The placeholder of the search input
   */
  @Input() searchPlaceholder: string;

  /**
   * Defines whether or not to show the scope selector
   */
  @Input() showScopeSelector = false;

  /**
   * Output the search data on submit
   */
  @Output() submitSearch = new EventEmitter<any>();
  /**
   * The pagination configuration
   */
  config: PaginationComponentOptions;
  /**
  * The pagination id
  */
  pageId = 'tl';
  /**
   * The sorting configuration
   */
  sortConfig: SortOptions;
  currentPageSubscription: Subscription;
  @Input() contenttype: any;
  selectedTeam: string = "123";
  collectionList: any = [];
  suggestionList: any = [];
  communitiesRD$: BehaviorSubject<PaginatedList<Community>> = new BehaviorSubject<PaginatedList<Community>>({} as any);
  linksToFollow: FollowLinkConfig<Community>[] = [];
  constructor(
    protected router: Router,
    protected searchService: SearchService,
    protected searchFilterService: SearchFilterService,
    protected paginationService: PaginationService,
    protected searchConfig: SearchConfigurationService,
    protected modalService: NgbModal,
    protected dsoService: DSpaceObjectDataService,
    public dsoNameService: DSONameService,
    private cds: CommunityDataService,
    private cdRef: ChangeDetectorRef,
  ) {
    this.config = new PaginationComponentOptions();
    this.config.id = this.pageId;
    this.config.pageSize = 1000;
    this.config.currentPage = 1;
    this.sortConfig = new SortOptions('dc.title', SortDirection.ASC);
  }
  
  ngOnInit(): void {
    this.initPage();
  }

  initPage() {
     const pagination$ = this.paginationService.getCurrentPagination(this.config.id, this.config);
    const sort$ = this.paginationService.getCurrentSort(this.config.id, this.sortConfig);

    this.currentPageSubscription = observableCombineLatest([pagination$, sort$]).pipe(
      switchMap(([currentPagination, currentSort]) => {
        return this.cds.findAll({
          currentPage: currentPagination.currentPage,
          elementsPerPage: 1000,
          sort: { field: currentSort.field, direction: currentSort.direction }
        }, true, false, ...this.linksToFollow,);
      })
    ).subscribe((results) => {
      this.communitiesRD$.next(results.payload);
      this.cdRef.detectChanges();
      // this.pageInfoState$.next(results.payload.pageInfo);
    });
  }

  /**
   * Retrieve the scope object from the URL so we can show its name
   */
  ngOnChanges(): void {
    if (isNotEmpty(this.scope)) {
      this.dsoService.findById(this.scope).pipe(getFirstSucceededRemoteDataPayload())
        .subscribe((scope: DSpaceObject) => this.selectedScope.next(scope));
    }
  }

  /**
   * Updates the search when the form is submitted
   * @param data Values submitted using the form
   */
  onSubmit(data: any) {
    if (isNotEmpty(this.scope)) {
      data = Object.assign(data, { scope: this.scope });
    }
    this.updateSearch(data);
    this.submitSearch.emit(data);
  }

  /**
   * Updates the search when the current scope has been changed
   * @param {string} scope The new scope
   */
  onScopeChange(scope: DSpaceObject) {
    this.updateSearch({ scope: scope ? scope.uuid : undefined });
    this.searchFilterService.minimizeAll();
  }

  /**
   * Updates the search URL
   * @param data Updated parameters
   */
  updateSearch(data: any) {
    const goToFirstPage = { 'spc.page': 1 };

    const queryParams = Object.assign(
      {
        ...goToFirstPage,
      },
      data,
    );
    if (hasValue(data.scope) && this.hideScopeInUrl) {
      delete queryParams.scope;
    }

    void this.router.navigate(this.getSearchLinkParts(), {
      queryParams: queryParams,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * @returns {string} The base path to the search page, or the current page when inPlaceSearch is true
   */
  public getSearchLink(): string {
    if (this.inPlaceSearch) {
      return currentPath(this.router);
    }
    return this.searchService.getSearchLink();
  }

  /**
   * @returns {string[]} The base path to the search page, or the current page when inPlaceSearch is true, split in separate pieces
   */
  public getSearchLinkParts(): string[] {
    if (this.inPlaceSearch) {
      return [];
    }
    return this.getSearchLink().split('/');
  }

  /**
   * Open the scope modal so the user can select DSO as scope
   */
  openScopeModal() {
    const ref = this.modalService.open(ScopeSelectorModalComponent);
    ref.componentInstance.scopeChange.pipe(take(1)).subscribe((scope: DSpaceObject) => {
      this.selectedScope.next(scope);
      this.onScopeChange(scope);
    });
  }

   onSelected(value: string): void {
    this.selectedTeam = value;
  }

  onSelectedScope(value: string): void {
    this.scope = value;
  }
}
