import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Injectable, OnInit, Output, PLATFORM_ID, ViewChild } from '@angular/core';
import { NgbCalendar, NgbDate, NgbDateParserFormatter, NgbDateStruct, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, map, switchMap, take } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { SortDirection, SortOptions } from 'src/app/core/cache/models/sort-options.model';
import { CollectionDataService } from 'src/app/core/data/collection-data.service';
import { ItemDataService } from 'src/app/core/data/item-data.service';
import { buildPaginatedList, PaginatedList } from 'src/app/core/data/paginated-list.model';
import { EPerson } from 'src/app/core/eperson/models/eperson.model';
import { PaginationService } from 'src/app/core/pagination/pagination.service';
import { Item } from 'src/app/core/shared/item.model';
import { getAllSucceededRemoteData } from 'src/app/core/shared/operators';
import { PageInfo } from 'src/app/core/shared/page-info.model';
import { URLCombiner } from 'src/app/core/url-combiner/url-combiner';
import { hasValue } from 'src/app/shared/empty.util';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { PaginationComponentOptions } from 'src/app/shared/pagination/pagination-component-options.model';
import { combineLatest as observableCombineLatest, Subscription } from 'rxjs';
import { ThemedLoadingComponent } from 'src/app/shared/loading/themed-loading.component';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';


@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {

  readonly DELIMITER = '/';


  parse(value: string): NgbDateStruct | null {
    if (value) {
      const date = value.split(this.DELIMITER);
      return {
        day: parseInt(date[0], 10),
        month: parseInt(date[1], 10),
        year: parseInt(date[2], 10)
      };
    }
    return null;
  }

  format(date: NgbDateStruct | null): string {
    if (date != null) {
      const month = date.month <= 9 ? "0" + date.month : date.month;
      const day = date.day <= 9 ? "0" + date.day : date.day;
      return date ? day + this.DELIMITER + month + this.DELIMITER + date.year : '';
    }


  }
}
@Component({
  selector: 'ds-productivity-report',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    ThemedLoadingComponent,
    PaginationComponent
  ],
  templateUrl: './productivity-report.component.html',
  styleUrl: './productivity-report.component.scss'
})
export class ProductivityReportComponent implements OnInit,AfterViewInit {
@ViewChild("dashboard") private dashboardElement: ElementRef;

  hoveredDate: NgbDate | null = null;
  items$: BehaviorSubject<PaginatedList<Item>> = new BehaviorSubject(buildPaginatedList<Item>(new PageInfo(), []));
  pageInfoState$: BehaviorSubject<PageInfo> = new BehaviorSubject<PageInfo>(undefined);
  config: PaginationComponentOptions;
  sortConfig: SortOptions;
  searching$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  currentSearchQuery: string;
  currentSearchScope: string;
  // The search form
  showdocument: Boolean = false;
  /**
   * The pagination id
   */
  items: any = [];
  finduser: any;
  pageId = 'tl';

  currentPageSubscription: Subscription;
  fromDate: NgbDate | null;
  toDate: NgbDate | null;
  loder: boolean = false;

  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();
  treename: string = "";
  actiontype: string = "";
  public states: Array<EPerson> = [];
  @Output() pageSizeChange: EventEmitter<number> = new EventEmitter<number>();
  constructor(private calendar: NgbCalendar, public formatter: NgbDateParserFormatter,
    private itemDataService: ItemDataService,
    private notificationsService: NotificationsService,
    private cds: CollectionDataService,
    private paginationService: PaginationService,
    private authService: AuthService, private elementRef: ElementRef,
    private cdRef: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: any,) {
    this.config = new PaginationComponentOptions();
    this.config.id = this.pageId;
    this.config.pageSize = 20;
    this.config.currentPage = 1;
    this.sortConfig = new SortOptions('dc.title', SortDirection.ASC);
    this.fromDate = calendar.getNext(calendar.getToday(), 'd', -30);
    this.toDate = calendar.getToday();
  }


  onDateSelection(date: NgbDate, datepicker: any) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date && date.after(this.fromDate)) {
      this.toDate = date;
      datepicker.close()
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }
  opennewtab(url, itemid) {
    window.open(url + itemid, '_blank');

  }
  isHovered(date: NgbDate) {
    return (
      this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }

  downloadEXsl(): void {
    this.itemDataService.getexcleEndpoint().pipe().subscribe((results) => {
      let frommonth = this.fromDate.month <= 9 ? "0" + this.fromDate.month : this.fromDate.month;
      let fromday = this.fromDate.day <= 9 ? "0" + this.fromDate.day : this.fromDate.day;
      let tomonth = this.toDate.month <= 9 ? "0" + this.toDate.month : this.toDate.month;
      let today = this.toDate.day <= 9 ? "0" + this.toDate.day : this.toDate.day;
      let startdate: string = this.fromDate.year + "-" + frommonth + "-" + fromday;
      let enddate: string = this.toDate.year + "-" + tomonth + "-" + today;
      this.authService.getShortlivedToken().pipe(take(1), map((token) =>
        hasValue(token) ? new URLCombiner(results + "/report/downloadItemReport?startdate=" + startdate + "&enddate=" + enddate, `?authentication-token=${token}`).toString() : results + "/report/downloadItemReport?startdate=" + startdate + "&enddate=" + enddate)).subscribe((logs: string) => {
          window.open(logs);
        });
      //window.open(results + "/report/downloadItemReport?startdate=" + startdate + "&enddate=" + enddate)
    })
    // console.log(this.itemDataService.getexcleEndpoint());

    //  window.open('http://localhost:8080/server/api/core/items/report/downloadItemReport?startdate=2022-12-15&enddate=2023-02-01')
  }


  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }
  ngOnInit(): void {
  }

  getresult(): void {
    this.loder = true;
    if (hasValue(this.currentPageSubscription)) {
      this.currentPageSubscription.unsubscribe();
      this.paginationService.resetPage(this.config.id);
    }

    const pagination$ = this.paginationService.getCurrentPagination(this.config.id, this.config);
    const sort$ = this.paginationService.getCurrentSort(this.config.id, this.sortConfig);
    let frommonth = this.fromDate.month <= 9 ? "0" + this.fromDate.month : this.fromDate.month;
    let fromday = this.fromDate.day <= 9 ? "0" + this.fromDate.day : this.fromDate.day;
    let tomonth = this.toDate.month <= 9 ? "0" + this.toDate.month : this.toDate.month;
    let today = this.toDate.day <= 9 ? "0" + this.toDate.day : this.toDate.day;
    let startdate: string = this.fromDate.year + "-" + frommonth + "-" + fromday;
    let enddate: string = this.toDate.year + "-" + tomonth + "-" + today;

    this.currentPageSubscription = observableCombineLatest([pagination$, sort$]).pipe(
      switchMap(([currentPagination, currentSort]) => {
        return this.itemDataService._getprogressReportByDate(startdate, enddate, {
          currentPage: currentPagination.currentPage,
          elementsPerPage: currentPagination.pageSize,

        });
      }),
      getAllSucceededRemoteData(),
    ).subscribe((results) => {
      this.loder = false;
      this.items$.next(results.payload);
      //this.items = results.payload.page;
      // console.log(this.items[0].submitter.firstMetadataValue('eperson.firstname'))
      this.pageInfoState$.next(results.payload.pageInfo);
    });



  }

  onPageChange(event) {
    this.loder = true;
    this.pageChange.emit(event);
  }

  /**
   * Emits the current page size when it changes
   * @param event The new page size
   */
  onPageSizeChange(event) {
    this.pageSizeChange.emit(event);
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
    }
  }

   showDate(date: string) {
    // Input: '2025-06-28'
    if (!date) return '';
    const [year, month, day] = date.split('-');
    const indianFormat = `${day}-${month}-${year}`;
    return indianFormat;
  }
}
