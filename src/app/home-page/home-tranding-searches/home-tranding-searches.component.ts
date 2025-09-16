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
  selector: 'ds-home-tranding-searches',
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
  templateUrl: './home-tranding-searches.component.html',
  styleUrl: './home-tranding-searches.component.scss'
})
export class HomeTrandingSearchesComponent {
  @Input() collectionorCommunityId;
  @Input() type;
  view: any[] = [550, 450];
  barView: any[] = [650, 450];
  chartOptions: any = [
    {
      "name": "Sri Lanka",
      "series": [
        {
          "value": 4,
          "name": "2016-09-18"
        },
        {
          "value": 7,
          "name": "2016-09-20"
        },
        {
          "value": 3,
          "name": "2016-09-16"
        },
        {
          "value": 5,
          "name": "2016-09-19"
        },
        {
          "value": 7,
          "name": "2016-09-24"
        }
      ]
    }
  ];
  barChart: any = [];
  timeline: boolean = true;
  data: any = [];
  i: number = 0;
  config: FindListOptions = Object.assign(new FindListOptions(), {
    elementsPerPage: 10
  });
  colorScheme: any = 'aqua';
  colorScheme1 = {
    domain: ['#3a406d'],
  };

  public isCollapsed = true;
  tableData = [
    { countryName: 'India', views: '1271', download: '338', search: '386' },
  ]
  subtableData: any;
  isLoading: boolean = false;
  isLoading1: boolean = false;
  isLoading2: boolean = false;
  plotsData: any;
  areaData: any;
  totalHits: any;
  searchType: string = 'All Searches';
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
    protected authorizationService: AuthorizationDataService,
    private authService: AuthService,
    public cdRef: ChangeDetectorRef,
    protected windowService: HostWindowService
  ) {    
    this.windowService.isLgOrXl().subscribe((isLgOrXl) => {
      if(isLgOrXl){
        this.maxLabelLength = 16;
      }else{
        this.maxLabelLength = 13;
      }
    });
    this.windowService.isXl().subscribe((isXl) => {
      if(isXl){
        this.maxLabelLength = 25;
      }
    })
  }
  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.loadData();
    this.assignColorsAndLoadData();
    this.colorScheme = {
      name: 'chartsTheme',
      selectable: true,
      group: ScaleType.Ordinal,
      domain: this.chartService.generateChartThemeColorRange()
    }
    this.isAdmin$ = this.authorizationService.isAuthorized(FeatureID.AdministratorOf);
  }
  loadData() {
    this.isLoading = true;
    const call1 = this.collectionorCommunityId ? '/getTrendingSearches?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingSearches?dateType=' + this.i + '&top=10'
    this.chartService.findAllByGeolocation(call1).pipe().subscribe((data) => {
      if (data) {
        this.barChart = data;
        this.isLoading = false;
        this.cdRef.detectChanges();
      } else {
        this.isLoading = false;
        this.cdRef.detectChanges();
      }
    });
    this.isLoading1 = true;
    const call2 = this.collectionorCommunityId ? '/getTrendingSearchesLinechart?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingSearchesLinechart?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(call2).pipe().subscribe((data) => {

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
        this.isLoading1 = false;
        this.cdRef.detectChanges();
        // this.chartOptions = [
        //   {
        //     name: data['name'],
        //     series: uniqueSeries
        //   }
        // ];
      } else {
        this.chartOptions = [];
        this.cdRef.detectChanges();
      }
    });
    const call4 = this.collectionorCommunityId ? '/getTrandingSearchHites?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrandingSearchHites?dateType=' + this.i + '&top=10';
    this.chartService.findAllByGeolocation(call4).pipe().subscribe((data) => {
      this.isLoading2 = false;
      this.cdRef.detectChanges();
      if (data) {
        this.totalHits = data['totalhits'];
      }
    });

  }

  buttonClick(j: number) {
    this.i = j;
    this.searchType = 'All Searches';
    this.loadData();
  }

  updateMap() {
    setTimeout(() => {
      $('#mapContainer').mapael({
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
        plots: this.plotsData,
        areas: this.areaData
      });
    }, 1000);
  }

  onDataPointHover(event: any) {
    console.log(event);
    if (event.name !== 'All Searches') {
      this.searchType = event.name;
      this.isLoading1 = true;
      const call2 = this.collectionorCommunityId ? '/getTrendingSearchesLinechart?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type + '&title=' + event.name : '/getTrendingSearchesLinechart?dateType=' + this.i + '&top=10&title=' + event.name;
      this.chartService.findAllByGeolocation(call2).pipe().subscribe((data) => {
        this.isLoading1 = false;
        this.cdRef.detectChanges();

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
          //     name: data['name'],
          //     series: uniqueSeries
          //   }
          // ];
        } else {
          console.error("Data is not in the expected format:", data);
          this.chartOptions = [];
        }
      });
      this.isLoading2 = true;
      const call3 = this.collectionorCommunityId ? '/getTrandingSearchMap?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type + '&title=' + event.name : '/getTrandingSearchMap?dateType=' + this.i + '&top=10&title=' + event.name;
      this.chartService.findAllByGeolocation(call3).pipe().subscribe((data) => {
        this.isLoading2 = false;
        this.cdRef.detectChanges();
        if (data) {
          this.plotsData = data;
          this.updateMap();
        }
      });
      const call5 = this.collectionorCommunityId ? '/getTrandingserchMapArea?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&title=' + event.name + '&type=' + this.type : '/getTrandingserchMapArea?dateType=' + this.i + '&top=10&title=' + event.name;
      this.chartService.findAllByGeolocation(call5).pipe().subscribe((data) => {
        this.isLoading2 = false;
        this.cdRef.detectChanges();
        if (data) {
          this.areaData = data;
          this.updateMap();
        }
      });
      const call4 = this.collectionorCommunityId ? '/getTrandingSearchHites?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&title=' + event.name + '&type=' + this.type : '/getTrandingSearchHites?dateType=' + this.i + '&top=10&title=' + event.name;
      this.chartService.findAllByGeolocation(call4).pipe().subscribe((data) => {
        this.isLoading2 = false;
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
      // window.open(data + '/report/downloadTrandingReport&dateType=' + this.i);
      this.authService.getShortlivedToken().pipe(take(1), map((token) =>
        hasValue(token) ? new URLCombiner(data + '/report/downloadTrandingMatricxsearch?dateType=' + this.i, `&authentication-token=${token}`).toString() : data + '/report/downloadTrandingReport?dateType=' + this.i)).subscribe((logs: string) => {
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

      this.isLoading2 = true;
      const call3 = this.collectionorCommunityId ? '/getTrandingSearchMap?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrandingSearchMap?dateType=' + this.i + '&top=10';
      this.chartService.findAllByGeolocation(call3).pipe().subscribe((data) => {
        this.isLoading2 = false;
        this.cdRef.detectChanges();
        if (data) {
          this.plotsData = data;
          this.updateMap();
        }
      });
      const call5 = this.collectionorCommunityId ? '/getTrandingserchMapArea?dateType=' + this.i + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrandingserchMapArea?dateType=' + this.i + '&top=10';
      this.chartService.findAllByGeolocation(call5).pipe().subscribe((data) => {
        this.isLoading2 = false;
        this.cdRef.detectChanges();
        if (data) {
          this.areaData = data;
          this.updateMap();
        }
      });

    }, 300);
  }
}
