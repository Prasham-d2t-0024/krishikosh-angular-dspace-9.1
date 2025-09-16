import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, Subscription, combineLatest as observableCombineLatest } from 'rxjs';
import {
  map,
  take,
  switchMap,
} from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import { RouteService } from '../../../../core/services/route.service';
import { Item } from '../../../../core/shared/item.model';
import { ViewMode } from '../../../../core/shared/view-mode.model';
import { getItemPageRoute } from '../../../item-page-routing-paths';
import {
  getDSpaceQuery,
  isIiifEnabled,
  isIiifSearchEnabled,
} from './item-iiif-utils';
import { AuthorizationDataService } from 'src/app/core/data/feature-authorization/authorization-data.service';
import { ChartService } from 'src/app/core/shared/trending-charts/chart.service';
import { PageInfo } from 'src/app/core/shared/page-info.model';
import { CommentDataService } from '../../../../core/data/comment-data.service';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { getAllCompletedRemoteData, getAllSucceededRemoteData, getFirstCompletedRemoteData } from 'src/app/core/shared/operators';
import { RemoteData } from 'src/app/core/data/remote-data';
import { NoContent } from 'src/app/core/shared/NoContent.model';
import { hasValue } from 'src/app/shared/empty.util';
import { PaginationComponentOptions } from 'src/app/shared/pagination/pagination-component-options.model';
import { PaginationService } from 'src/app/core/pagination/pagination.service';
import { buildPaginatedList, PaginatedList } from 'src/app/core/data/paginated-list.model';
import { SortDirection, SortOptions } from 'src/app/core/cache/models/sort-options.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from 'src/app/core/shared/Comment.model';
import * as am4core from "@amcharts/amcharts4/core";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { AuthService } from 'src/app/core/auth/auth.service';
import { Bookmark } from 'src/app/core/shared/bookmark.model';
import { BookmarkDataService } from 'src/app/core/data/bookmark-data.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FeatureConfigService } from 'src/app/shared/feature-config.service';

am4core.useTheme(am4themes_animated);

declare var $: any;

@Component({
  selector: 'ds-item',
  template: '',
  standalone: true,
})
/**
 * A generic component for displaying metadata and relations of an item
 */
export class ItemComponent implements OnInit {
  @Input() object: Item;

  /**
   * Whether to show the badge label or not
   */
  @Input() showLabel = true;

  /**
   * The viewmode we matched on to get this component
   */
  @Input() viewMode: ViewMode;

  /**
   * This regex matches previous routes. The button is shown
   * for matching paths and hidden in other cases.
   */
  previousRoute = /^(\/search|\/browse|\/collections|\/admin\/search|\/mydspace)/;

  /**
   * Used to show or hide the back to results button in the view.
   */
  showBackButton$: Observable<boolean>;

  /**
   * Route to the item page
   */
  itemPageRoute: string;

  /**
   * Enables the mirador component.
   */
  iiifEnabled: boolean;

  /**
   * Used to configure search in mirador.
   */
  iiifSearchEnabled: boolean;

  /**
   * The query term from the previous dspace search.
   */
  iiifQuery$: Observable<string>;

  mediaViewer;

  /**
   * Enables display of geospatial item page fields
   */
  geospatialItemPageFieldsEnabled = false;

  myrating: any;
  isAuthorized$: Observable<boolean> = of(false);
  bookmarkitem: any;
  avgrating: number = 0;
  dateType: number = 0;
  breakingRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  isLoading: boolean = false;
  collectionorCommunityId: string;
  chartOptions: any = [];
  isLoading2: boolean = false;
  plotsData: any;
  areaData: any;
  pageInfoState$: BehaviorSubject<PageInfo> = new BehaviorSubject<PageInfo>(undefined);
  loder: boolean = false;
  currentPageSubscription: Subscription;
  comment$: BehaviorSubject<PaginatedList<Comment>> = new BehaviorSubject(buildPaginatedList<Comment>(new PageInfo(), []));
  sortConfigComment: SortOptions;
  @Output() pageSizeChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() paginationChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() prev = new EventEmitter<boolean>();
  @Output() next = new EventEmitter<boolean>();
  CommentFormGroup: FormGroup;
  itemId: string;
  config = Object.assign(new PaginationComponentOptions(), {
    id: 'csp',
    currentPage: 1,
    pageSize: 5,
  });
  sortConfig: SortOptions;
  // mapThemeShades : string[] = ['#5ed0f3ff', '#229bc0ff', '#0a6d8bff', '#004960'];
  // mapThemeLabels : string[] = ['< 100 Views', '100 - 500 Views', '500 - 1000 Views', '> 1000 Views'];
  // categoryColorMap = new Map<any, any>();
  // customLegendItems: any[] = [];
  colorScheme = {
    domain: ['#004960', '#00958f']
  };
  allowCommenting:boolean;
  allowRating:boolean;

  constructor(protected routeService: RouteService,
    protected router: Router,
    protected authorizationService: AuthorizationDataService,
    private chartService: ChartService,
    private route: ActivatedRoute,
    public cdRef: ChangeDetectorRef,
    private commentDataService: CommentDataService,
    public notificationsService: NotificationsService,
    private paginationService: PaginationService,
    private fb: FormBuilder,
    private authService: AuthService,
    private bookmarkdataservice: BookmarkDataService,
    public sanitizer: DomSanitizer,
    public featureConfigService: FeatureConfigService
  ) {
    this.mediaViewer = environment.mediaViewer;
    this.geospatialItemPageFieldsEnabled = environment.geospatialMapViewer.enableItemPageFields;
    this.sortConfigComment = new SortOptions('dc.title', SortDirection.ASC);
    this.sortConfig = new SortOptions('dc.date.accessioned', SortDirection.DESC);
    this.colorScheme = {
      domain: [this.chartService.primaryColor, this.chartService.secondaryColor]
    };
    this.featureConfigService.load();
    this.allowCommenting = this.featureConfigService.allowCommenting;
    this.allowRating = this.featureConfigService.allowRating;
  }

  /**
   * The function used to return to list from the item.
   */
  back = () => {
    this.routeService.getPreviousUrl().pipe(
      take(1),
    ).subscribe(
      (url => {
        this.router.navigateByUrl(url);
      }),
    );
  };

  ngOnInit(): void {
    // this.isAuthorized$ = this.authorizationService.isAuthorized(FeatureID.CanEditItem, this.object.self);
    this.isAuthorized$ = this.authService.isAuthenticated();
    this.itemPageRoute = getItemPageRoute(this.object);
    this.findBookMark();
    if(this.allowCommenting) this.getCommentList();
    if(this.allowRating){
      this.findRating();
      this.findAvgRating();
      this.findRatingBreaking();
    }
    this.showBackButton$ = this.routeService.getPreviousUrl().pipe(
      map((url: string) => this.previousRoute.test(url)),
      take(1),
    );
    this.createCommentFormGroup();
    // check to see if iiif viewer is required.
    this.iiifEnabled = isIiifEnabled(this.object);
    this.iiifSearchEnabled = isIiifSearchEnabled(this.object);
    if (this.iiifSearchEnabled) {
      this.iiifQuery$ = getDSpaceQuery(this.object, this.routeService);
    }
    this.assignColorsAndLoadData();
    this.loadData();
  }

  printPage() {
    window.print();
  }

  createCommentFormGroup() {
    this.CommentFormGroup = this.fb.group({
      comments: ['', Validators.required],
    });
  }
  Citation(content) {
  }

  saveRating(ratingcount) {
    this.isAuthorized$.pipe(take(1)).subscribe((isautho: Boolean) => {
      if (isautho) {
        if (this.myrating != undefined && this.myrating.id) {
          this.myrating.ratingcount = ratingcount;
          delete this.myrating.submitterRest;
          delete this.myrating.itemRest;         
          delete this.myrating.metadata;         
          delete this.myrating.type;         
          this.commentDataService.put(this.myrating).pipe(
            getFirstCompletedRemoteData()
          ).subscribe((rd: RemoteData<Comment>) => {
            if (rd.hasSucceeded) {
              this.myrating = rd.payload;
              this.findAvgRating();
              this.findRatingBreaking();
               this.cdRef.detectChanges();
              this.notificationsService.success('Thanks for rating this item! We are updating records.!');
            } else {
              this.notificationsService.error('An error occurred while rating the item! ');
            }
          })
        } else {
          let data = {
            "commenttype": 2,
            "ratingcount": ratingcount,
            "itemRest": {
              "uuid": this.object.uuid
            }
          };

          const commentToCreate = Object.assign(new Comment(), data);
          this.commentDataService.create(commentToCreate).pipe(
            getFirstCompletedRemoteData()
          ).subscribe((rd: RemoteData<Comment>) => {
            if (rd.hasSucceeded) {
              this.myrating = rd.payload;
              this.findAvgRating();
              this.findRatingBreaking();
              this.cdRef.detectChanges();
              this.notificationsService.success('Thanks for rating this item! We are updating records.!');
            } else {
              this.notificationsService.error('An error occurred while rating the item! ');
            }
          })
        }
        
      } else {
        this.notificationsService.warning('You are not logged in! ');
       }
    })
   
  }

  savebookmark() {
    if (this.bookmarkitem != undefined && this.bookmarkitem.id) {
      let newStatus = (this.bookmarkitem.status === 'active') ? 'dactive' : 'active';
      let payload = {
        ...this.bookmarkitem,
        status: newStatus,
        itemRest: { uuid: this.bookmarkitem.itemRest?.uuid },
        submitterRest: { uuid: this.bookmarkitem.submitterRest?.uuid }
      };
      this.bookmarkdataservice.put(payload).pipe(
        getFirstCompletedRemoteData()
      ).subscribe((rd: RemoteData<Bookmark>) => {
        if (rd.hasSucceeded) {
          this.bookmarkitem = rd.payload;
          this.cdRef.detectChanges();
          if (this.bookmarkitem.status === 'active') {
            this.notificationsService.success('Bookmark this item  successfully!');
          } else {
            this.notificationsService.success('UnBookmark this item  successfully!');
          }

        } else {
          this.notificationsService.error('An error occurred while Bookmarking this item! ');
        }
      })
    } else {
      let data = {
        "itemRest": {
          "uuid": this.object.uuid
        }
      };
      const bookmarkToCreate = Object.assign(new Bookmark(), data);
      this.bookmarkdataservice.create(bookmarkToCreate).pipe(
        getFirstCompletedRemoteData()
      ).subscribe((rd: RemoteData<Bookmark>) => {

        if (rd.hasSucceeded) {
          // debugger;
          this.bookmarkitem = rd.payload;
          //this.CommentFormGroup.reset();
          //this.getCommentList();
          this.cdRef.detectChanges();
          this.notificationsService.success('Bookmark this item  successfully!');
        } else {
          this.notificationsService.error('An error occurred while Bookmarking this item! ');
        }
      })
    }
  }

  buttonClick(j) {
    this.dateType = j;
    this.loadData();
    this.loadMapData();
  }

  loadData() {
    this.isLoading = true;
    this.route.paramMap.subscribe(params => {
      this.itemId = params.get('id'); // 'id' matches the route parameter name
    });
    const colstring = '/getItemAnalytics?dateType=' + this.dateType + '&top=10&collectionorcommunityid=' + this.itemId + '&type=item';
    this.chartService.findAllByGeolocation(colstring).pipe().subscribe((data) => {
      this.cdRef.detectChanges();
      if (data) {
        this.chartOptions = data;
        this.isLoading = false;
      }
    });
  }

  loadMapData() {
    const colstring1 = '/getTopViewDownloadserchMap?dateType=' + this.dateType + '&top=10&collectionorcommunityid=' + this.itemId + '&type=item';
    this.chartService.findAllByGeolocation(colstring1).pipe().subscribe((data) => {
      if (data) {
        this.plotsData = data;
        this.isLoading2 = false;
        this.cdRef.detectChanges();
      } else {
        this.isLoading2 = false;
        this.cdRef.detectChanges();
      }
    });
    const colstring2 = '/getTopViewDownloadserchMapArea?dateType=' + this.dateType + '&top=10&collectionorcommunityid=' + this.itemId + '&type=item';
    this.chartService.findAllByGeolocation(colstring2).pipe().subscribe((data) => {
      this.isLoading = false;
      this.cdRef.detectChanges();
      if (data) {
        this.areaData = data;
      }
    });
  }

  get breakingRatingArr() {
    // Converts the object to an array of { key, value }
    // You can use Object.entries if you only want key-value pairs
    return Object.entries(this.breakingRating).map(([key, value]) => ({ key, value }));
  }

  flagComment(obj) {
    let { actiondate, comment, ratingcount, _links } = obj
    let payload = {
      actiondate,
      comment,
      ratingcount,
      _links,
      status: 3,
      submitterRest: { uuid: obj.submitterRest?.uuid },
      itemRest: { uuid: obj.itemRest?.uuid }
    };
    this.commentDataService.put1(payload).pipe(
      getFirstCompletedRemoteData()
    ).subscribe((rd: RemoteData<NoContent>) => {
      if (rd.hasSucceeded) {
        this.getCommentList();
        this.notificationsService.success('Flag comment successfully!');
      } else {
        this.notificationsService.error('An error occurred while flaging the comment! ');
      }
    })
  }


  getCommentList() {
    this.loder = true;
    if (hasValue(this.currentPageSubscription)) {
      this.currentPageSubscription.unsubscribe();
      this.paginationService.resetPage(this.config.id);
    }

    const pagination$ = this.paginationService.getCurrentPagination(this.config.id, this.config);
    const sort$ = this.paginationService.getCurrentSort(this.config.id, this.sortConfigComment);
    this.currentPageSubscription = observableCombineLatest([pagination$, sort$]).pipe(
      switchMap(([currentPagination, currentSort]) => {
        return this.commentDataService.findCommentByItem(this.object.uuid, {
          currentPage: currentPagination.currentPage,
          elementsPerPage: currentPagination.pageSize,
        }, false);
      }),
      getAllSucceededRemoteData(),
    ).subscribe((results) => {
      this.loder = false;
      this.comment$.next(results.payload);
      this.pageInfoState$.next(results.payload.pageInfo);
    });

  }

  onPageSizeChange(event) {
    this.pageSizeChange.emit(event);
  }

  onPageChange(event) {
    this.loder = true;
    this.pageChange.emit(event);
  }

  savecomment() {
    this.isAuthorized$.pipe(take(1)).subscribe((isautho: Boolean) => {
      if (isautho) {
        let data = {
          "commenttype": 1,
          "comment": this.CommentFormGroup.value.comments,
          "itemRest": {
            "uuid": this.object.uuid
          }
        };
        const commentToCreate = Object.assign(new Comment(), data);
        this.commentDataService.create(commentToCreate).pipe(
          getFirstCompletedRemoteData()
        ).subscribe((rd: RemoteData<NoContent>) => {

          if (rd.hasSucceeded) {
            this.CommentFormGroup.reset();
            this.getCommentList();
            this.notificationsService.success('Comment added successfully!');
          } else {
            this.notificationsService.error('An error occurred while adding the comment! ');
          }
        })
      } else {
        this.notificationsService.warning('You are not logged in! ');
      }
    })
  }

  findBookMark() {
    // console.log(this.bookmarkitem);
    this.isAuthorized$.pipe(take(1)).subscribe((isautho: Boolean) => {
      if (isautho) {
        this.bookmarkdataservice.findBookmarkByuserofItem(this.object.id).pipe(getFirstCompletedRemoteData()).subscribe((rd) => {
          if (rd.hasSucceeded) {
            this.bookmarkitem = rd.payload;
          }
        })

      }
    })

  }
  getasfalink(link: string) {
    let orcidBaseUrl = "https://orcid.org/";
    let extractedLink = link;

    if (link.includes("[")) {
      extractedLink = link.split("[")[1].split("]")[0];
    }

    // Ensure the ORCID link is correctly formatted
    if (!extractedLink.startsWith(orcidBaseUrl)) {
      extractedLink = orcidBaseUrl + extractedLink;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(extractedLink);
  }

  getagrovoclink(link: string) {
    let orcidBaseUrl = "https://orcid.org/";
    let extractedLink = link;

    if (link.includes("[")) {
      extractedLink = link.split("[")[1].split("]")[0];
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(extractedLink);
  }

  findRatingBreaking():void {   
   this.commentDataService.findratingBarkingofItem(this.object.id, null, false).pipe(getAllCompletedRemoteData()).subscribe((rd:any) => {
      if (rd.hasSucceeded) {
        this.breakingRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if ((rd?.payload?.raitingmap) && Object.keys(rd.payload.raitingmap).length != 0) {
          Object.keys(rd.payload.raitingmap).forEach((key, index) => {
            this.breakingRating[key] = rd.payload.raitingmap[key];
            this.cdRef.detectChanges();
          });
        } 
      }
    })
  }

   findAvgRating():void {
   
    this.commentDataService.findAvgratingByuserofItem(this.object.id, null, false).pipe(getFirstCompletedRemoteData()).subscribe((rd1: any) => {
      if (rd1.state === 'Success') {
        // console.log("insode mmmmmmmmmmmmm")
        this.avgrating = parseInt(rd1.payload.ratingcount == null ? 0 : rd1.payload.ratingcount);
        //console.log("rd.payload..AVG..", this.avgrating)
        this.cdRef.detectChanges();
      }
    })
  }

    findRating() {
    this.isAuthorized$.pipe(take(1)).subscribe((isautho: Boolean) => {
      if (isautho) {
        this.commentDataService.findMyratingByuserofItem(this.object.id).pipe(getFirstCompletedRemoteData()).subscribe((rd) => {
          if (rd.hasSucceeded) {
            this.myrating = rd.payload;
            this.cdRef.detectChanges();
          }
        })
       }
    })  
  }

  getwidthRating(brestart, ratingcount) {
    if (Number.isNaN((100 * brestart) /ratingcount)) {
      return '0px';
    } else {
      return ((100 * brestart) / ratingcount) + '%';
   }
  }

  assignColorsAndLoadData() {
    this.colorScheme = {
      domain: [ this.chartService.primaryColor, this.chartService.secondaryColor ]
    }
    
    // this.mapThemeShades = this.chartService.generateShades().reverse();
    setTimeout(() => {
      //   this.categoryColorMap = new Map(
      //   this.mapThemeLabels.map((label, i) => [label, { normal: this.mapThemeShades[i] }])
      // );

      // this.customLegendItems = this.mapThemeLabels.map((label, i) => ({
      //   label,
      //   color: this.mapThemeShades[i],
      //   category: label,
      //   selected: false
      // }));
    this.loadMapData();
    }, 300);
  } 

}
