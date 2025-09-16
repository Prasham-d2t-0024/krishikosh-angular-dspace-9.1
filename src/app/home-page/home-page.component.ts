import {
  AsyncPipe,
  CommonModule,
  NgTemplateOutlet,
} from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  Injector,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import {
  APP_CONFIG,
  AppConfig,
} from 'src/config/app-config.interface';

import { Site } from '../core/shared/site.model';
import { SuggestionsPopupComponent } from '../notifications/suggestions/popup/suggestions-popup.component';
import { ThemedConfigurationSearchPageComponent } from '../search-page/themed-configuration-search-page.component';
import { ThemedSearchFormComponent } from '../shared/search-form/themed-search-form.component';
import { HomeCoarComponent } from './home-coar/home-coar.component';
import { ThemedHomeNewsComponent } from './home-news/themed-home-news.component';
import { RecentItemListComponent } from './recent-item-list/recent-item-list.component';
import { ThemedTopLevelCommunityListComponent } from './top-level-community-list/themed-top-level-community-list.component';
import { NgbCarouselModule, NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeTrendingItemComponent } from './home-trending-item/home-trending-item.component';
import { HomeTrandingGeolocationComponent } from './home-tranding-geolocation/home-tranding-geolocation.component';
import { HomeTrandingCommunitiesComponent } from './home-tranding-communities/home-tranding-communities.component';
import { HomeTrandingSearchesComponent } from './home-tranding-searches/home-tranding-searches.component';
import { HomeTrandingTypesComponent } from './home-tranding-types/home-tranding-types.component';
import { SearchConfigurationService } from '../core/shared/search/search-configuration.service';
import { getFirstCompletedRemoteData, getFirstSucceededRemoteData } from '../core/shared/operators';
import { RemoteData } from '../core/data/remote-data';
import { SearchFilterConfig } from '../shared/search/models/search-filter-config.model';
import { SearchService } from '../core/shared/search/search.service';
import { HostWindowService } from '../shared/host-window.service';
import { App_Config } from '../app-config';
import { SearchOptions } from '../shared/search/models/search-options.model';
import { GenericConstructor } from '../core/shared/generic-constructor';
import { SearchFacetFilterComponent } from '../shared/search/search-filters/search-filter/search-facet-filter/search-facet-filter.component';
import { FilterType } from '../shared/search/models/filter-type.model';
import { renderFilterType } from '../shared/search/search-filters/search-filter/search-filter-type-decorator';
import { FILTER_CONFIG, IN_PLACE_SEARCH, REFRESH_FILTER, SearchFilterService } from '../core/shared/search/search-filter.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SEARCH_CONFIG_SERVICE } from '../my-dspace-page/my-dspace-configuration.service';
import { SearchFormComponent } from '../shared/search-form/search-form.component';
import { AppImageConfigService } from '../shared/app-image-config.service';
import { SidebarService } from '../shared/sidebar/sidebar.service';
@Component({
  selector: 'ds-base-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    HomeCoarComponent,
    NgTemplateOutlet,
    RecentItemListComponent,
    SuggestionsPopupComponent,
    ThemedConfigurationSearchPageComponent,
    ThemedHomeNewsComponent,
    SearchFormComponent,
    ThemedTopLevelCommunityListComponent,
    TranslateModule,
    NgbNavModule,
    CommonModule,
    NgbCarouselModule,
    HomeTrendingItemComponent,
    HomeTrandingGeolocationComponent,
    HomeTrandingSearchesComponent,
    HomeTrandingTypesComponent,
    HomeTrandingCommunitiesComponent,
  ],
    providers: [
    {
      provide: FILTER_CONFIG,
      useValue: SearchFilterConfig
    },
    {
      provide: IN_PLACE_SEARCH,
      useValue: SearchFilterConfig
    },
    {
      provide: REFRESH_FILTER,
      useValue: SearchFilterConfig
    },
    {
      provide:SEARCH_CONFIG_SERVICE,
      useValue:SearchConfigurationService
    }
  ]
})
export class HomePageComponent implements OnInit, AfterViewInit {

  site$: Observable<Site>;
  recentSubmissionspageSize: number;
  showDiscoverFilters: boolean;
  contenttype: any = [];
  allFilters: any;
  filter: SearchFilterConfig;
  isXsOrSm$: Observable<boolean>;
  dctype: any = [];
  image = App_Config.homePageImage;
  searchOptions$: Observable<SearchOptions>;
  searchFilter: GenericConstructor<SearchFacetFilterComponent>;
  objectInjector: Injector;
  advSearchForm: FormGroup;
  visible: boolean = true;
  public casetypesearch: any;
  public casenosearch: any;
  public yearsearch: any;
  items: any = [];
  casetype = [];
  homepageImagePath: string;
  homePageImageHeight: string;
  homePageLayoutConfig: any;

  constructor(
    private searchService: SearchService,
    public searchConfigService: SearchConfigurationService,
    protected windowService: HostWindowService,
    private _router: Router,
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
    @Inject(FILTER_CONFIG) public filterConfig: SearchFilterConfig,
    protected route: ActivatedRoute,
    @Inject(IN_PLACE_SEARCH) public inPlaceSearch: boolean,
    @Inject(REFRESH_FILTER) public refreshFilters: BehaviorSubject<boolean>,
    private injector: Injector,
    private formBuilder: FormBuilder,
    public searchConfigurationService: SearchConfigurationService,
    private imageConfig: AppImageConfigService,
    private sidebarService: SidebarService,
  ) {
    this.isXsOrSm$ = this.windowService.isXsOrSm();
    this.recentSubmissionspageSize = this.appConfig.homePage.recentSubmissions.pageSize;
    this.showDiscoverFilters = this.appConfig.homePage.showDiscoverFilters;
    this.imageConfig.load();
    this.sidebarService.isCollapsed.subscribe((isCollapsed) => {
      this.visible = isCollapsed;
    });
  }
  

  ngOnInit(): void {
    this.site$ = this.route.data.pipe(
      map((data) => data.site as Site),
    );
    this.homepageImagePath = this.imageConfig.homepage;
    this.homePageImageHeight = this.imageConfig.imageSizes?.homepage?.height || '400px';
    this.homePageLayoutConfig = this.imageConfig.homePageLayoutConfig;

    setTimeout(() => {
      if(this.homePageLayoutConfig.showBanner){
        const backdrop = document.querySelector('.backdrop') as HTMLElement;
        const searchBarWrapper = document.querySelector('.search-bar-wrapper') as HTMLElement;
        if (backdrop && this.homepageImagePath) {
          backdrop.style.backgroundImage = `url('${this.homepageImagePath}')`;
          backdrop.style.height = this.homePageImageHeight;
        }
        if (searchBarWrapper) {
          searchBarWrapper.style.marginTop = this.imageConfig?.imageSizes?.homepage?.searchBarDistanceFromTop || '15vh';
        }
      }
    });
  }

  ngAfterViewInit(): void {
     this.searchFilter = this.getSearchFilter();
    this.objectInjector = Injector.create({
      providers: [
        { provide: FILTER_CONFIG, useFactory: () => (this.filterConfig), deps: [] },
        { provide: IN_PLACE_SEARCH, useFactory: () => (this.inPlaceSearch), deps: [] },
        { provide: REFRESH_FILTER, useFactory: () => (this.refreshFilters), deps: [] }
      ],
      parent: this.injector
    });
    
    this.advSearchForm = this.formBuilder.group({
      textsearch1: new FormControl('', {}),
      textsearch2: new FormControl('', {
        
      }),
      textsearch3: new FormControl('', {
       
      }),
      filter1: new FormControl('title', {}),
      filter2: new FormControl('author', {
        
      }),
      filter3: new FormControl('subject',{}),
      language: new FormControl('123', {}),
      edspartner: new FormControl('123', {}),
      ContentTYPE: new FormControl('123', {}),
      maxdate: new FormControl('', {}),
      mindate: new FormControl('', {}),
      formate: new FormControl('123', {}),
    });
    
    this.searchConfigService.setPaginationId('spc');
  //  this.filter.name = 'subject';
    this.site$ = this.route.data.pipe(
      map((data) => data.site as Site),
    );
    /// this type of item 
    this.searchConfigService.getConfig("", undefined).pipe(
      getFirstCompletedRemoteData(),
    ).subscribe((filtersRD: RemoteData<SearchFilterConfig[]>) => {
      this.allFilters = filtersRD.payload;
      this.filter = filtersRD.payload.find(x => x.name === 'itemtype');
      //console.log(this.filter);
      this.filter.pageSize = 100;
      
      this.searchService.getFacetValuesFor(this.filter, 1, null).pipe(getFirstSucceededRemoteData()).subscribe((rd: any) => {
        let a = rd.payload.page;
        this.contenttype = rd.payload.page;
        this.contenttype = [...this.contenttype].sort((a, b) => a.label.localeCompare(b.label));
        this.isXsOrSm$.pipe(take(1)).subscribe((mobile) => {
          if (mobile) {
            for (let i = 0; i < a.length; i += 1) {
              this.dctype.push(a.slice(i, i + 1));
            }
          } else {
            for (let i = 0; i < a.length; i += 6) {
              this.dctype.push(a.slice(i, i + 6));
            }
          }
          
        })
      })
      
    })
    this.searchOptions$ = this.searchConfigService.searchOptions;
  }

   /**
   * Find the correct component based on the filter config's type
   */
 private getSearchFilter() {
  const type: FilterType = this.filterConfig.filterType;
  return renderFilterType(type);
}

  public geticon(filtername) {
    if (filtername.includes('Communication')) {
      return 'fa fa-video-camera img';
    } else if (filtername.includes('Article')) {
      return 'fa fa-file-text img';
    } else if (filtername.includes('Book')) {
      return 'fas fa-book-open img';
    } else if (filtername.includes('Video')) {
      return 'fa fa-video-camera img';
    } else if (filtername.includes('Conference')) {
      return 'fa fa-users img';
    } else {
      return 'fa fa-book img';
    }
  }

  gotsearchpage(query) {
    let data = query.split('=');
    const queryParams = { [data[0]]: decodeURI(data[1]) };
    this._router.navigate(['/search'], { queryParams });
  }

   /**
   * Set the sidebar to a collapsed state
   */
  public toggleSidebar(): void {
    this.visible = !this.visible;
  }

}
