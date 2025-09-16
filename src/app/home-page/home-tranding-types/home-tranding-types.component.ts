import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbCarouselModule, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import moment from 'moment';
import { map, Observable, take } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AuthorizationDataService } from 'src/app/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from 'src/app/core/data/feature-authorization/feature-id';
import { ChartService } from 'src/app/core/shared/trending-charts/chart.service';
import { URLCombiner } from 'src/app/core/url-combiner/url-combiner';
import { hasValue } from 'src/app/shared/empty.util';

@Component({
  selector: 'ds-home-tranding-types',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    NgbTooltipModule,
    RouterModule,
    NgbModule,
    NgxChartsModule,
    NgbCarouselModule
  ],
  templateUrl: './home-tranding-types.component.html',
  styleUrl: './home-tranding-types.component.scss'
})
export class HomeTrandingTypesComponent {
  @Input() collectionorCommunityId;
  @Input() type;
  view: any[] = [450, 150];
  lineChartView: any[] = [650, 300];
  chartOptions: any = [];
  lineChart: any = [];
  timeline: boolean = true;
  data: any = [];
  i: number = 0;

  colorScheme1 = 'aqua';
  colorScheme = {
    domain: ['#004960'],
  };
  sideCardData: any = [];
  typeData: any;
  selectedType: string = 'All Type';
  totalHits: string;
  isLoading: boolean = false;
  isLoading1: boolean = false;
  isLoading2: boolean = false;
  xAxisTicks: any;
  /**
   * Whether the current user is an admin or not
   */
  isAdmin$: Observable<boolean>;
  constructor(public chartService: ChartService,
    public cdRef: ChangeDetectorRef,
    protected authorizationService: AuthorizationDataService,
    private authService: AuthService,
  ) {
    this.chartOptions = [
      {
        "name": "Sri Lanka",
        "series": [
          {
            "value": 4,
            "name": "2016-09-18"
          },
          {
            "value": 6,
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
            "value": 2,
            "name": "2016-09-24"
          }
        ]
      }
    ]

    this.lineChart = [];
  }

  ngOnInit(): void {
    this.colorScheme = {
      domain: [this.chartService.primaryColor]
    };
    this.colorScheme1 = this.chartService.trendingTypesChartTheme ? this.chartService.trendingTypesChartTheme : 'air';
    this.loadData();
    this.isAdmin$ = this.authorizationService.isAuthorized(FeatureID.AdministratorOf);
  }

  getReducedTicks(dates: Date[]): Date[] {
    if (dates.length > 20) {
      const maxTicks = 10; // Define the maximum number of ticks to show
      const tickInterval = Math.max(1, Math.floor(dates.length / maxTicks)); // Calculate interval

      // Filter dates to only include the ones to show on the axis
      return dates.filter((_, index) => index % tickInterval === 0);
    } else {
      return dates;
    }
  }

  loadData() {
    this.isLoading = true;
    this.isLoading1 = true;
    this.isLoading2 = true;
    const call1 = this.collectionorCommunityId ? '/getTrendingTypesLineChart?top=10&dateType=' + this.i + '&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingTypesLineChart?top=10&dateType=' + this.i;
    this.chartService.findAllByGeolocation(call1).pipe().subscribe((data: any) => {
      this.isLoading = false;
      if (data) {
        this.lineChart = data;
        // Extract dates from all series into a single array
        const allDates = [];
        this.lineChart.forEach((series: any) => {
          series.series.forEach((item: any) => {
            allDates.push(new Date(item.name)); // Extracting date from the "name" field
          });
        });

        // Get unique dates
        const uniqueDates = Array.from(new Set(allDates.map(date => date.getTime())))
          .map(time => new Date(time)); // Remove duplicates

        // Reduce the ticks based on unique dates
        if (uniqueDates.length > 20) {
          this.xAxisTicks = this.getReducedTicks(uniqueDates); // Apply tick reduction logic
          for (let i = 0; i < this.xAxisTicks.length; i++) {
            this.xAxisTicks[i] = moment(this.xAxisTicks[i]).format('YYYY-MM-DD');
          }
        } else {
          this.xAxisTicks = uniqueDates;

          // Format all dates to 'YYYY-MM-DD'
          for (let i = 0; i < this.xAxisTicks.length; i++) {
            this.xAxisTicks[i] = moment(this.xAxisTicks[i]).format('YYYY-MM-DD');
          }

        }
      }

      // for(const i of data) {
      //   if (i && i['series'] && Array.isArray(i['series'])) {
      //     // Group by date and sum values if needed, or keep each date entry as-is.
      //     const uniqueSeries = [];
      //     this.chartOptions = [];
      //     i['series'].forEach((entry) => {
      //       // Find if the date already exists in the uniqueSeries array
      //       const existingEntry = uniqueSeries.find(e => e.name === entry.name);

      //       if (existingEntry) {
      //         // If it exists, add the value (convert to number for addition)
      //         existingEntry.value += Number(entry.value);
      //       } else {
      //         // If it doesn't exist, add a new entry with date and value
      //         uniqueSeries.push({
      //           name: entry.name,
      //           value: Number(entry.value)
      //         });
      //       }
      //     });

      //     // Assign the transformed data to chartOptions in the required format
      //     this.lineChart.push(
      //       {
      //         name: data['name'],
      //         series: uniqueSeries
      //       }
      //     )

      //   } else {
      //     console.error("Data is not in the expected format:", data);
      //     this.chartOptions = [];
      //   }
      // }

      this.cdRef.detectChanges();
    });
    const call2 = this.collectionorCommunityId ? '/getTrendingTypesData?top=10&dateType=' + this.i + '&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingTypesData?top=10&dateType=' + this.i;
    this.chartService.findAllByGeolocation(call2).pipe().subscribe((data) => {
      if (data) {
        this.isLoading1 = false;
        this.isLoading2 = false;
        this.sideCardData = data['tradingData'];
        this.totalHits = data['totalhits'];
        if (data && data['tradingLineChart']['series'] && Array.isArray(data['tradingLineChart']['series'])) {
          const uniqueSeries = [];
          this.chartOptions = [];
          data['tradingLineChart']['series'].forEach((entry) => {
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
          this.cdRef.detectChanges();
        } else {
          console.error("Data is not in the expected format:", data);
          this.chartOptions = [];
        }
      } else {
        this.isLoading1 = false;
        this.isLoading2 = false;
        this.cdRef.detectChanges();
      }


    });
    const call3 = this.collectionorCommunityId ? '/getTrendingTypes?top=10&dateType=' + this.i + '&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingTypes?top=10&dateType=' + this.i;
    this.chartService.findAllByGeolocation(call3).pipe().subscribe((data) => {
      if (data) {
        this.typeData = data;
        this.cdRef.detectChanges();
      }

    });
  }

  onSelect(event: any) {
    if (event === '') {
      this.selectedType = "All Types";
      this.isLoading1 = true;
      this.isLoading2 = true;
      const call2 = this.collectionorCommunityId ? '/getTrendingTypesData?top=10&dateType=' + this.i + '&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingTypesData?top=10&dateType=' + this.i;
      this.chartService.findAllByGeolocation(call2).pipe().subscribe((data) => {
        this.isLoading1 = false;
        this.isLoading2 = false;
        if (data) {
          this.sideCardData = data['tradingData'];
          this.totalHits = data['totalhits'];
          // this.chartOptions = data['tradingLineChart'];
          if (data && data['tradingLineChart']['series'] && Array.isArray(data['tradingLineChart']['series'])) {
            // Group by date and sum values if needed, or keep each date entry as-is.
            const uniqueSeries = [];
            this.chartOptions = [];
            data['tradingLineChart']['series'].forEach((entry) => {
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
            //     name: data['tradingLineChart']['name'] !== null ? data['tradingLineChart']['name']:'',
            //     series: uniqueSeries
            //   }
            // ];
          } else {
            console.error("Data is not in the expected format:", data);
            this.chartOptions = [];
          }
          this.cdRef.detectChanges();
        }
      });

    } else {
      this.selectedType = event;
      this.isLoading1 = true;
      this.isLoading2 = true;
      const call2 = this.collectionorCommunityId ? '/getTrendingTypesData?top=10&trendingtypes=' + this.selectedType + '&dateType=' + this.i + '&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type : '/getTrendingTypesData?top=10&trendingtypes=' + this.selectedType + '&dateType=' + this.i;
      this.chartService.findAllByGeolocation(call2).pipe().subscribe((data) => {
        this.isLoading1 = false;
        this.isLoading2 = false;
        if (data) {
          this.sideCardData = data['tradingData'];
          this.totalHits = data['totalhits'];
          // this.chartOptions = data['tradingLineChart'];
          if (data && data['tradingLineChart']['series'] && Array.isArray(data['tradingLineChart']['series'])) {
            // Group by date and sum values if needed, or keep each date entry as-is.
            const uniqueSeries = [];
            this.chartOptions = [];
            data['tradingLineChart']['series'].forEach((entry) => {
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
            //     name: data['tradingLineChart']['name'] !== null ? data['tradingLineChart']['name']:'',
            //     series: uniqueSeries
            //   }
            // ];
          } else {
            console.error("Data is not in the expected format:", data);
            this.chartOptions = [];
          }
          this.cdRef.detectChanges();
        }
      });
    }
  }

  buttonClick(i) {
    this.i = i;
    this.selectedType === "All Types";
    this.loadData();
  }

  downloadExcel() {
    this.chartService.downloadZIP().subscribe((data: any) => {
      this.authService.getShortlivedToken().pipe(take(1), map((token) =>
            hasValue(token) ? new URLCombiner(data +'/report/downloadTrandingMatricxtype?dateType=' + this.i , `&authentication-token=${token}`).toString() : data+'/report/downloadTrandingReport?dateType=' + this.i)).subscribe((logs: string) => {
              window.open(logs);
            });
    },
    (error) => {
      console.error('Error downloading the ZIP file', error);
    })
  }

}
