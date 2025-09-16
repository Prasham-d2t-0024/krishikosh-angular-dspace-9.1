import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { map, Observable, take } from 'rxjs';
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
  selector: 'ds-home-tranding-communities',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    NgbTooltipModule,
    RouterModule,
    NgbModule,
    NgxChartsModule,
    DisplayMapComponent
  ],
  templateUrl: './home-tranding-communities.component.html',
  styleUrl: './home-tranding-communities.component.scss'
})
export class HomeTrandingCommunitiesComponent {
  @Input() collectionorCommunityId;
  @Input() type;
  public isCollapsed = true;
  i: number = 0;
  tableData = [
    { countryName: 'India', views: '1271', download: '338', search: '386' },
  ]
  subtableData: any = [
    { empty: '', countryName: 'India', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'United States', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Singapore', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'United Kingdom', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Serbia', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Belgium', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Canada', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Bhutan', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Pakistan', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Bangladesh', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Nepal', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Sri Lanka', views: '1271', download: '338', search: '386' },
    { empty: '', countryName: 'Netherlands', views: '1271', download: '338', search: '386' },
  ]

  view: any[] = [450, 150];
  barView: any[] = [650, 450];
  chartOptions: any = [];
  barChart: any = [];
  timeline: boolean = true;

  colorScheme: any = 'aqua';
  colorScheme1 = {
    domain: ['#004960'],
  };

  config: FindListOptions = Object.assign(new FindListOptions(), {
    elementsPerPage: 10
  });
  isLoading: boolean = false;
  isLoading1: boolean = false;
  isLoading2: boolean = false;
  areaData: any;
  plotsData: any;
  totalHits: any;
  communityType: string = 'All Communities';
  // mapThemeShades: string[] = ['#5ed0f3ff', '#229bc0ff', '#0a6d8bff', '#004960'];
  // mapThemeLabels: string[] = ['< 100 Views', '100 - 500 Views', '500 - 1000 Views', '> 1000 Views'];
  // categoryColorMap = new Map<any, any>();
  // customLegendItems: any[] = [];
  maxLabelLength: number = 18;
  /**
   * Whether the current user is an admin or not
   */
  isAdmin$: Observable<boolean>;
  constructor(public chartService: ChartService,
    public cdRef: ChangeDetectorRef,
    protected authorizationService: AuthorizationDataService,
    private authService: AuthService,
    protected windowService: HostWindowService
  ) {
    this.chartOptions = [];
    this.barChart = [];
    this.windowService.isLgOrXl().subscribe((isLgOrXl) => {
        this.maxLabelLength = 13;
    });
    this.windowService.isXl().subscribe((isXl) => {
      if(isXl){
        this.maxLabelLength = 20;
      }
    })
  }
  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.assignColorsAndLoadData();
    this.isAdmin$ = this.authorizationService.isAuthorized(FeatureID.AdministratorOf);
  }

  loadData() {
    this.isLoading = true;
    this.isLoading1 = true;
    this.isLoading2 = true;
    const call1 = this.collectionorCommunityId ? '/getTrendingCommunityBarchart?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingCommunityBarchart?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(call1).pipe().subscribe((data) => {
      this.isLoading = false;
      this.cdRef.detectChanges();
      if (data) {
        this.barChart = data;
      }
    });
    const call2 = this.collectionorCommunityId ? '/getTrendingCommunityLinechart?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingCommunityLinechart?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(call2).pipe().subscribe((data) => {
      this.isLoading1 = false;
      this.cdRef.detectChanges();
      if (data) {
        // this.chartOptions = data;
        if (data && data['series'] && Array.isArray(data['series'])) {
          // Group by date and sum values if needed, or keep each date entry as-is.
          const uniqueSeries = [];
          this.chartOptions = [];
          data['series'].forEach((entry) => {
            // Find if the date already exists in the uniqueSeries array
            const existingEntry = uniqueSeries.find(e => e.name === entry.name);

            if (existingEntry) {
              // If it exists, add the value (convert to number for addition)
              existingEntry.value += Number(entry.value);
            } else {
              // If it doesn't exist, add a new entry with date and value
              uniqueSeries.push({
                name: entry.name,
                value: Number(entry.value)
              });
            }
          });

          // Assign the transformed data to chartOptions in the required format
          this.chartOptions = uniqueSeries;
          // this.chartOptions = [
          //   {
          //     name: data['name'] !== null ? data['name']:'',
          //     series: uniqueSeries
          //   }
          // ];
        } else {
          console.error("Data is not in the expected format:", data);
          this.chartOptions = [];
        }
      }
    });
    const call3 = this.collectionorCommunityId ? '/getTrandingCommunityMap?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrandingCommunityMap?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(call3).pipe().subscribe((data) => {

      if (data) {
        this.plotsData = data;
        this.isLoading2 = false;
        this.cdRef.detectChanges();
        this.checkAndUpdateMap()

      } else {
        this.isLoading2 = false;
        this.cdRef.detectChanges();
      }
    });
    const call4 = this.collectionorCommunityId ? '/getTrandingCommunityMapArea?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrandingCommunityMapArea?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(call4).pipe().subscribe((data) => {
      this.cdRef.detectChanges();
      if (data) {
        this.areaData = data;
        this.checkAndUpdateMap()
        this.cdRef.detectChanges();
      }
    });
    const call5 = this.collectionorCommunityId ? '/getTrendingCommunityCount?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingCommunityCount?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(call5).pipe().subscribe((data) => {
      this.cdRef.detectChanges();
      if (data) {
        this.totalHits = data['totalhits'];
      }
    });
  }

  checkAndUpdateMap() {
    if (this.areaData && this.plotsData) {
      this.updateMap(); // Only update the map when both data sources are ready
    }
  }

  buttonClick(j) {
    this.i = j;
    this.communityType = 'All Communities';
    this.loadData();
  }
  updateMap() {
    setTimeout(() => {
      $('#TrendingCommunitiesChartcartMap').mapael({
        map: {
          name: 'world_countries',
          zoom: {
            enabled: true,
            maxLevel: 10
          },
          defaultArea: {
            attrs: {
              fill: "#ced8d0",
              stroke: "#ced8d0"
            }
          }
        },
        legend: {
          area: {
            mode: "horizontal",
            slices: [
              {
                label: "< 100 Views",
                max: 100,
                attrs: {
                  fill: "#b3e5fc"
                }
              },
              {
                label: "100 - 500 Views",
                min: 101,
                max: 500,
                attrs: {
                  fill: "#81d4fa"
                }
              },
              {
                label: "500 - 1000 Views",
                min: 501,
                max: 1000,
                attrs: {
                  fill: "#279ae1"
                }
              },
              {
                label: "> 1000 Views",
                min: 1001,
                attrs: {
                  fill: "#2776e1"
                }
              }
            ]
          }
        },
        areas: this.areaData,
        plots: this.plotsData
      });
    }, 1000); // Slight delay to ensure data is ready
  }

  onDataPointHover(event: any) {
    console.log(event);
    if (event.name !== 'All Communities') {
      this.isLoading1 = true;
      this.isLoading2 = true;
      this.communityType = event.name;

      const encodedName = encodeURIComponent(event.name);

      const call2 = this.collectionorCommunityId ?
        `/getTrendingCommunityLinechart?dateType=${this.i}&top=10&collectionorcommunityid=${this.collectionorCommunityId}&title=${encodedName}` + '&type=' + this.type :
        `/getTrendingCommunityLinechart?dateType=${this.i}&top=10&title=${encodedName}`;

      this.chartService.findAllByGeolocation(call2).pipe().subscribe((data) => {
        this.isLoading1 = false;
        this.cdRef.detectChanges();
        if (data) {
          if (data['series'] && Array.isArray(data['series'])) {
            const uniqueSeries = [];
            this.chartOptions = [];
            data['series'].forEach((entry) => {
              const existingEntry = uniqueSeries.find(e => e.name === entry.name);
              if (existingEntry) {
                existingEntry.value += Number(entry.value);
              } else {
                uniqueSeries.push({
                  name: entry.name,
                  value: Number(entry.value)
                });
              }
            });
            this.chartOptions = uniqueSeries;
            // this.chartOptions = [
            //   {
            //     name: data['name'] !== null ? data['name'] : '',
            //     series: uniqueSeries
            //   }
            // ];
          } else {
            console.error("Data is not in the expected format:", data);
            this.chartOptions = [];
          }
        }
      });

      const call3 = this.collectionorCommunityId ?
        `/getTrandingCommunityMap?dateType=${this.i}&top=10&collectionorcommunityid=${this.collectionorCommunityId}&title=${encodedName}` + '&type=' + this.type :
        `/getTrandingCommunityMap?dateType=${this.i}&top=10&title=${encodedName}`;

      this.chartService.findAllByGeolocation(call3).pipe().subscribe((data) => {
        this.isLoading2 = false;
        this.cdRef.detectChanges();
        if (data) {
          this.plotsData = data;
          this.updateMap();
          this.cdRef.detectChanges();
        }
      });

      const call4 = this.collectionorCommunityId ?
        `/getTrandingCommunityMapArea?dateType=${this.i}&top=10&collectionorcommunityid=${this.collectionorCommunityId}&title=${encodedName}` + '&type=' + this.type :
        `/getTrandingCommunityMapArea?dateType=${this.i}&top=10&title=${encodedName}`;

      this.chartService.findAllByGeolocation(call4).pipe().subscribe((data) => {
        this.cdRef.detectChanges();
        if (data) {
          this.areaData = data;
          this.updateMap();
          this.cdRef.detectChanges();
        }
      });

      const call5 = this.collectionorCommunityId ?
        `/getTrendingCommunityCount?dateType=${this.i}&top=10&collectionorcommunityid=${this.collectionorCommunityId}&title=${encodedName}` + '&type=' + this.type :
        `/getTrendingCommunityCount?dateType=${this.i}&top=10&title=${encodedName}`;

      this.chartService.findAllByGeolocation(call5).pipe().subscribe((data) => {
        this.cdRef.detectChanges();
        if (data) {
          this.totalHits = data['totalhits'];
        }
      });
    } else {
      this.buttonClick(this.i);
    }
  }

  downloadExcel() {
    this.chartService.downloadZIP().subscribe((data: any) => {
      this.authService.getShortlivedToken().pipe(take(1), map((token) =>
        hasValue(token) ? new URLCombiner(data + '/report/downloadTrandingMatricxCommunity?dateType=' + this.i, `&authentication-token=${token}`).toString() : data + '/report/downloadTrandingReport?dateType=' + this.i)).subscribe((logs: string) => {
          window.open(logs);
        });
    },
      (error) => {
        console.error('Error downloading the ZIP file', error);
      })
  }

  assignColorsAndLoadData() {
    this.colorScheme1 = {
      domain: [this.chartService.primaryColor]
    }
    this.colorScheme = {
      name: 'chartsTheme',
      selectable: true,
      group: ScaleType.Ordinal,
      domain: this.chartService.generateChartThemeColorRange()
    }
    // this.mapThemeShades = this.chartService.generateShades().reverse();
    setTimeout(() => {
      // this.categoryColorMap = new Map(
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
