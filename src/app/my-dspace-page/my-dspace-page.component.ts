import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output,
} from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest as observableCombineLatest } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { MyDSpaceResponseParsingService } from '../core/data/mydspace-response-parsing.service';
import { MyDSpaceRequest } from '../core/data/request.models';
import { RoleType } from '../core/roles/role-types';
import { Context } from '../core/shared/context.model';
import { SearchService } from '../core/shared/search/search.service';
import { ViewMode } from '../core/shared/view-mode.model';
import { SuggestionsNotificationComponent } from '../notifications/suggestions/notification/suggestions-notification.component';
import { RoleDirective } from '../shared/roles/role.directive';
import { SearchConfigurationOption } from '../shared/search/search-switch-configuration/search-configuration-option.model';
import { ThemedSearchComponent } from '../shared/search/themed-search.component';
import {
  MyDSpaceConfigurationService,
  SEARCH_CONFIG_SERVICE,
} from './my-dspace-configuration.service';
import { MyDSpaceNewSubmissionComponent } from './my-dspace-new-submission/my-dspace-new-submission.component';
import { MyDspaceQaEventsNotificationsComponent } from './my-dspace-qa-events-notifications/my-dspace-qa-events-notifications.component';
import { NgbNavChangeEvent, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SearchComponent } from '../shared/search/search.component';
import { hasValue } from '../shared/empty.util';
import { PaginationService } from '../core/pagination/pagination.service';
import { CommentDataService } from '../core/data/comment-data.service';
import { PaginationComponentOptions } from '../shared/pagination/pagination-component-options.model';
import { getAllSucceededRemoteData, getFirstCompletedRemoteData } from '../core/shared/operators';
import { PageInfo } from '../core/shared/page-info.model';
import { buildPaginatedList, PaginatedList } from '../core/data/paginated-list.model';
import { SortDirection, SortOptions } from '../core/cache/models/sort-options.model';
import { TranslateModule } from '@ngx-translate/core';
import { RemoteData } from '../core/data/remote-data';
import { NoContent } from '../core/shared/NoContent.model';
import { NotificationsService } from '../shared/notifications/notifications.service';
import { BookmarkComponent } from './bookmark/bookmark.component';
import { Comment } from '../core/shared/Comment.model';
import { TruncatablePartComponent } from '../shared/truncatable/truncatable-part/truncatable-part.component';
import { TruncatableComponent } from '../shared/truncatable/truncatable.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { FeatureConfigService } from '../shared/feature-config.service';
export const MYDSPACE_ROUTE = '/mydspace';

/**
 * This component represents the whole mydspace page
 */
@Component({
  selector: 'ds-base-my-dspace-page',
  styleUrls: ['./my-dspace-page.component.scss'],
  templateUrl: './my-dspace-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: SEARCH_CONFIG_SERVICE,
      useClass: MyDSpaceConfigurationService,
    },
  ],
  imports: [
    AsyncPipe,
    MyDSpaceNewSubmissionComponent,
    MyDspaceQaEventsNotificationsComponent,
    RoleDirective,
    SuggestionsNotificationComponent,
    ThemedSearchComponent,
    NgbNavModule,
    SearchComponent,
    TranslateModule,
    DatePipe,
    CommonModule,
    BookmarkComponent,
    PaginationComponent,

  ],
  standalone: true,
})
export class MyDSpacePageComponent implements OnInit {
  active = 1;

  /**
   * The list of available configuration options
   */
  configurationList$: Observable<SearchConfigurationOption[]>;

  /**
   * The start context to use in the search: workspace or workflow
   */
  context: Context;

  /**
   * The start configuration to use in the search: workspace or workflow
   */
  configuration: string;

  /**
   * Variable for enumeration RoleType
   */
  roleTypeEnum = RoleType;

  /**
   * List of available view mode
   */
  viewModeList = [ViewMode.ListElement, ViewMode.DetailedListElement];
  loder: boolean = false;
  allowCommenting: boolean = false;
  currentPageSubscription: Subscription;
  config: PaginationComponentOptions;
  pageId = 'tl';
  pageInfoState$: BehaviorSubject<PageInfo> = new BehaviorSubject<PageInfo>(undefined);
  comment$: BehaviorSubject<PaginatedList<Comment>> = new BehaviorSubject(buildPaginatedList<Comment>(new PageInfo(), []));
  sortConfigComment: SortOptions;
  totalCommets: number = null;
  @Output() pageSizeChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();

  constructor(private service: SearchService,
    @Inject(SEARCH_CONFIG_SERVICE) public searchConfigService: MyDSpaceConfigurationService,
    private paginationService: PaginationService,
    private commentDataService: CommentDataService,
    public notificationsService: NotificationsService,
    public featureConfigService: FeatureConfigService
    ) {
    this.service.setServiceOptions(MyDSpaceResponseParsingService, MyDSpaceRequest);
    this.config = new PaginationComponentOptions();
    this.config.id = this.pageId;
    this.config.pageSize = 5;
    this.config.currentPage = 1;
    this.sortConfigComment = new SortOptions('dc.title', SortDirection.ASC);
    this.featureConfigService.load();
  }

  /**
   * Initialize available configuration list
   *
   * Listening to changes in the paginated search options
   * If something changes, update the search results
   *
   * Listen to changes in the scope
   * If something changes, update the list of scopes for the dropdown
   *
   * Listen to changes in the configuration
   * If something changes, update the current context
   */
  ngOnInit(): void {
    this.configurationList$ = this.searchConfigService.getAvailableConfigurationOptions();

    this.configurationList$.pipe(take(1)).subscribe((configurationList: SearchConfigurationOption[]) => {
      this.configuration = configurationList[0].value;
      this.context = configurationList[0].context;
    });

    this.allowCommenting = this.featureConfigService.allowCommenting;
  }

  onNavChange(changeEvent: NgbNavChangeEvent) {
    if (changeEvent.nextId === 3) {
      this.getCommentList();
    }
  }

  getCommentList() {
    this.loder = true;
    if (hasValue(this.currentPageSubscription)) {
      this.currentPageSubscription.unsubscribe();
      this.paginationService.resetPage(this.config.id);
    }

    const pagination$ = this.paginationService.getCurrentPagination(this.config.id, this.config);
    const sort$ = this.paginationService.getCurrentSort(this.config.id, this.sortConfigComment);
    this.currentPageSubscription = observableCombineLatest([pagination$, sort$])
      .pipe(
        switchMap(([currentPagination, currentSort]) => {
          return this.commentDataService.findFlaggedComment({
            currentPage: currentPagination.currentPage,
            elementsPerPage: currentPagination.pageSize,
          }, false);
        }),
        getAllSucceededRemoteData(),
      ).subscribe((results) => {
        this.loder = false;
        this.comment$.next(results.payload);
        this.totalCommets = results?.payload?.totalElements;
        this.pageInfoState$.next(results.payload.pageInfo);
      });

  }

  commentAction(obj, actionType) {
    let { actiondate, comment, ratingcount, _links } = obj
    let payload = {
      actiondate,
      comment,
      ratingcount,
      _links,
      status: null,
      submitterRest: { uuid: obj.submitterRest?.uuid },
      itemRest: { uuid: obj.itemRest?.uuid }
    };
    switch (actionType) {
      case 'unflag':
        payload.status = 1;
        break;
      case 'delete':
        payload.status = 4;
        break;
    }
    this.commentDataService.put1(payload).pipe(
      getFirstCompletedRemoteData()
    ).subscribe((rd: RemoteData<NoContent>) => {
      if (rd.hasSucceeded) {
        this.getCommentList();
        this.notificationsService.success('Unflag comment successfully!');
      } else {
        this.notificationsService.error('An error occurred while unflagging the comment! ');
      }
    })
  }

  onPageChange(event) {
    this.loder = true;
    this.pageChange.emit(event);
  }

    onPageSizeChange(event) {
    this.pageSizeChange.emit(event);
  }

}
