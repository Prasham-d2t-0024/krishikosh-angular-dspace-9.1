import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { first, map, Observable, take } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AuthorizationDataService } from 'src/app/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from 'src/app/core/data/feature-authorization/feature-id';
import { FindListOptions } from 'src/app/core/data/find-list-options.model';
import { ChartService } from 'src/app/core/shared/trending-charts/chart.service';
import { URLCombiner } from 'src/app/core/url-combiner/url-combiner';
import { DisplayMapComponent } from 'src/app/shared/display-map/display-map.component';
import { hasValue } from 'src/app/shared/empty.util';
import { HostWindowService } from 'src/app/shared/host-window.service';
declare var $: any;

@Component({
  selector: 'ds-home-tranding-geolocation',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    NgbModule,
    NgbTooltipModule,
    DisplayMapComponent
  ],
  templateUrl: './home-tranding-geolocation.component.html',
  styleUrl: './home-tranding-geolocation.component.scss'
})
export class HomeTrandingGeolocationComponent {
  @Input() collectionorCommunityId;
  @Input() type;
  init: boolean = false;
  data: any;
  tableData: any;
  i: number = 0;
  totalView: number = 0;
  totalDownload: number = 0;
  totalSearches: number = 0;
  public isCollapsed = true;
  subtableData: any;
  config: FindListOptions = Object.assign(new FindListOptions(), {
    elementsPerPage: 10
  });
  countriesData: any = {
    plots: {
      "Ahmedabad": {
        "city": "Ahmedabad",
        "latitude": 23.033295,
        "tooltip": {
          "content": "\u003cstrong class\u003d\"country_name\"\u003eAhmedabad\u003c/strong\u003e\u003cbr /\u003e\u003cspan class\u003d\"support3lbl\"\u003eViews: 3\u003c/span\u003e\u003c/br\u003e \u003cspan class\u003d\"support3lbl\"\u003eDownloads: 0\u003c/span\u003e \u003c/br\u003e\u003cspan class\u003d\"support3lbl\"\u003e Searches: 20 \u003c/span\u003e"
        },
        "width": 12,
        "type": "image",
        "value": 23,
        "url": "http://localhost:4000/assets/images/marker.png",
        "height": 40,
        "longitude": 72.6167
      },
    },
  };
  plotsData: any;
  areaData: any;
  countryData: any;
  selectedCountry: string = 'All Countries';
  isLoading: boolean = false;
  isLoading1: boolean = false;
  isMobileView: boolean = false;
  // mapThemeShades : string[] = ['#5ed0f3ff', '#229bc0ff', '#0a6d8bff', '#004960'];
  // mapThemeLabels : string[] = ['< 100 Views', '100 - 500 Views', '500 - 1000 Views', '> 1000 Views'];
  // categoryColorMap = new Map<any, any>();
  // customLegendItems: any[] = [];
   /**
   * Whether the current user is an admin or not
   */
  isAdmin$: Observable<boolean>;
  constructor(
    public chartService: ChartService,
    private windowService: HostWindowService,
    private cdref: ChangeDetectorRef,
    protected authorizationService: AuthorizationDataService,
    private authService: AuthService,
  ) {
    this.windowService.isXsOrSm().pipe(
      first()
    ).subscribe((isMobile) => {
      this.isMobileView = isMobile;
    });
  }

  ngOnInit(): void {
    this.assignColorsAndLoadData();
    this.isAdmin$ = this.authorizationService.isAuthorized(FeatureID.AdministratorOf);
  }

  loadData() {
    this.isLoading1 = true;
    const API1 = this.collectionorCommunityId ? '/getTopViewDownloadserch?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTopViewDownloadserch?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(API1).pipe().subscribe((data) => {
      this.isLoading1 = false;
      this.subtableData = !!data ? data : [];
      const totalRow = this.subtableData.find((row) => row.contry === 'Total');
      if (totalRow) {
        // Do something with the total row, e.g., log it or store it in a variable
        this.totalView = totalRow.view;
        this.totalDownload = totalRow.download;
        this.totalSearches = totalRow.search;
      } else {
        this.totalView = 0;
        this.totalDownload = 0;
        this.totalSearches = 0;
      }
      this.cdref.detectChanges();
    });
    this.isLoading = true;
    const API2 = this.collectionorCommunityId ? '/getTopViewDownloadserchMap?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTopViewDownloadserchMap?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(API2).pipe().subscribe((data) => {
      this.isLoading = false;
      this.plotsData = data;
      this.cdref.detectChanges();
    });
    
    const API3 = this.collectionorCommunityId ? '/getTopViewDownloadserchMapArea?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTopViewDownloadserchMapArea?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(API3).pipe().subscribe((data) => {
      this.areaData = data;
      this.cdref.detectChanges();
    });
    const API4 = this.collectionorCommunityId ? '/getCountries?top=10&dateType=' + this.i + '&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getCountries?top=10&dateType=' + this.i;
    this.chartService.findAllByGeolocation(API4).pipe().subscribe((data) => {
      this.countryData = data;
      this.cdref.detectChanges();
    });
  }

  showData() {
    return this.tableData;
  }

  buttonClick(i) {
    this.i = i;
    this.selectedCountry = 'All Countries';
    this.loadData();
  }

  onSelect(event: string) {
    this.selectedCountry = event;
    if (this.selectedCountry === 'All Countries') {
      this.buttonClick(this.i);
    } else {
      const API1 = this.collectionorCommunityId ? '/getTopViewDownloadserchByCountry?dateType=' + this.i + '&top=10&country=' + this.selectedCountry + '&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTopViewDownloadserchByCountry?dateType=' + this.i + '&top=10&country=' + this.selectedCountry;
      this.chartService.findAllByGeolocation(API1).pipe().subscribe((data) => {
        if (data) {
          this.subtableData = data;
          // Find the row with the name "Total"
          const totalRow = this.subtableData.find((row) => row.contry === 'Total');

          if (totalRow) {
            // Do something with the total row, e.g., log it or store it in a variable
            this.totalView = totalRow.view;
            this.totalDownload = totalRow.download;
            this.totalSearches = totalRow.search;
          } else {
            this.totalView = 0;
            this.totalDownload = 0;
            this.totalSearches = 0;
          }
          this.cdref.detectChanges();
        }
      });
      this.isLoading = true;
      const API3 = this.collectionorCommunityId ? '/getTopViewDownloadserchMap?dateType=' + this.i + '&top=10&country=' + this.selectedCountry + '&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTopViewDownloadserchMap?dateType=' + this.i + '&top=10&country=' + this.selectedCountry;;
      this.chartService.findAllByGeolocation(API3).pipe().subscribe((data) => {
        this.isLoading = false;
        this.plotsData = data;
        this.cdref.detectChanges();
      });
      const API4 = this.collectionorCommunityId ? '/getTopViewDownloadserchMapArea?dateType=' + this.i + '&top=10&country=' + this.selectedCountry + '&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTopViewDownloadserchMapArea?dateType=' + this.i + '&top=10&country=' + this.selectedCountry;;
      if(this.i >= 0){
        this.chartService.findAllByGeolocation(API4).pipe().subscribe((data) => {
          this.areaData = data;
          this.cdref.detectChanges();
        });
      }
    }
  }

   downloadExcel() {
    this.chartService.downloadZIP().subscribe((data: any) => {
      this.authService.getShortlivedToken().pipe(take(1), map((token) =>
            hasValue(token) ? new URLCombiner(data +'/report/downloadTrandingMatricxGeolocation?dateType=' + this.i , `&authentication-token=${token}`).toString() : data+'/report/downloadTrandingReport?dateType=' + this.i)).subscribe((logs: string) => {
              window.open(logs);
            });
    },
    (error) => {
      console.error('Error downloading the ZIP file', error);
    })
  }

  assignColorsAndLoadData() {
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
      this.loadData();
    }, 300);
  } 

}
