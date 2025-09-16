import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, switchMap, combineLatest as observableCombineLatest } from 'rxjs';
import { BookmarkDataService } from 'src/app/core/data/bookmark-data.service';
import { ItemDataService } from 'src/app/core/data/item-data.service';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { PaginationService } from 'src/app/core/pagination/pagination.service';
import { Bookmark } from 'src/app/core/shared/bookmark.model';
import { Item } from 'src/app/core/shared/item.model';
import { getAllCompletedRemoteData, getAllSucceededRemoteData } from 'src/app/core/shared/operators';
import { PageInfo } from 'src/app/core/shared/page-info.model';
import { ViewMode } from 'src/app/core/shared/view-mode.model';
import { hasValue } from 'src/app/shared/empty.util';
import { ListableObjectComponentLoaderComponent } from 'src/app/shared/object-collection/shared/listable-object/listable-object-component-loader.component';
import { PaginationComponentOptions } from 'src/app/shared/pagination/pagination-component-options.model';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';

@Component({
  selector: 'ds-bookmark',
  templateUrl: './bookmark.component.html',
  styleUrls: ['./bookmark.component.scss'],
  standalone: true,
  imports: [
    ListableObjectComponentLoaderComponent,
    PaginationComponent,
    CommonModule,
    TranslateModule
  ]
})
export class BookmarkComponent implements OnInit {
  bookMarks: BehaviorSubject<PaginatedList<Item>> = new BehaviorSubject<PaginatedList<Item>>({} as any)// Observable<RemoteData<PaginatedList<Bookmark>>>;
  config: PaginationComponentOptions = Object.assign(new PaginationComponentOptions(), {
    id: 'elp',
    pageSize: 5,
    currentPage: 1
  });
  itemarray: any = [];
  pageInfoState$: BehaviorSubject<PageInfo> = new BehaviorSubject<PageInfo>(undefined);
  workFlow: Observable<RemoteData<PaginatedList<Item>>>;
  totalBookmarks: any = null;
  @Output() pageSizeChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() paginationChange: EventEmitter<any> = new EventEmitter<any>();
  /**
* The view-mode we're currently on
* @type {ViewMode}
*/
  viewMode = ViewMode.ListElement;
  currentPageSubscription: Subscription;

  constructor(private itemDataService: ItemDataService, private route: ActivatedRoute, private paginationService: PaginationService,
  ) { }

  ngOnInit(): void {
    this.getBookmarkItems();
    // this.route.queryParamMap.subscribe(params => {
    //   const page = params.get(`${this.config.id}.page`);
    //   this.config.currentPage = page ? +page : 1;
    //   this.getBookmarkItems();
    // });
  }


  getBookmarkItems() {
    if (hasValue(this.currentPageSubscription)) {
      this.currentPageSubscription.unsubscribe();
      this.paginationService.resetPage(this.config.id);
    }
    const pagination$ = this.paginationService.getCurrentPagination(this.config.id, this.config);
    this.currentPageSubscription = observableCombineLatest([pagination$])
      .pipe(
        switchMap(([currentPagination]) => {
          return this.itemDataService.getMyBookmark('getMyBookMarkItems',
            {
              currentPage: currentPagination.currentPage,
              elementsPerPage: currentPagination.pageSize
            }, false, false);
        }),
        getAllSucceededRemoteData(),
      ).subscribe((results: RemoteData<PaginatedList<Item>>) => {
        this.bookMarks.next(results.payload);
        this.totalBookmarks = results?.payload?.totalElements;
        this.pageInfoState$.next(results.payload.pageInfo);
      });
  }

  onPageSizeChange(event) {
    this.pageSizeChange.emit(event);
  }

  onPageChange(event) {
    this.config.currentPage = event;
    this.pageChange.emit(event);
    this.getBookmarkItems();
  }

  onPaginationChange(event) {
    this.paginationChange.emit(event);
  }

  ngOnDestroy(): void {
    this.currentPageSubscription.unsubscribe();
  }
} 
