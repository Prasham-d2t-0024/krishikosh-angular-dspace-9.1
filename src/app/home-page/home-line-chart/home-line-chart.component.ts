import { ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import moment from 'moment';
import { ChartService } from 'src/app/core/shared/trending-charts/chart.service';

@Component({
  selector: 'ds-home-line-chart',
  standalone: true,
  imports: [
    TranslateModule,
    NgxChartsModule
  ],
  templateUrl: './home-line-chart.component.html',
  styleUrl: './home-line-chart.component.scss'
})
export class HomeLineChartComponent {
  @Input() lineChartdata: any;
  @Input() collectionorCommunityId: string;
  @Input() type;
  @Input() dateType;
  view: any[] = [550, 350];
  chartOptions: any = [];
  // options
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = false;
  showLegend: boolean = true;
  showLegendLabel: boolean = true;
  legendPosition: string = 'below';
  showXAxisLabel: boolean = false;
  yAxisLabel: string = 'Country';
  xAxisLabel: string = 'Counts';
  showYAxisLabel: boolean = false;
  timeline: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  legend: boolean = true;
  data:any=[]

  colorScheme = 'aqua';
  schemeType: string = 'ordinal';
  isLoading:boolean = false;
  constructor(public chartService: ChartService,
    public cdref: ChangeDetectorRef
  ) {
    this.chartOptions =  [
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
      },
      {
        "name": "Paraguay",
        "series": [
          {
            "value": 4,
            "name": "2016-09-18"
          },
          {
            "value": 8,
            "name": "2016-09-20"
          },
          {
            "value": 6,
            "name": "2016-09-16"
          },
          {
            "value": 7,
            "name": "2016-09-19"
          },
          {
            "value": 3,
            "name": "2016-09-24"
          }
        ]
      },
      {
        "name": "Algeria",
        "series": [
          {
            "value": 5,
            "name": "2016-09-18"
          },
          {
            "value": 8,
            "name": "2016-09-20"
          },
          {
            "value": 6,
            "name": "2016-09-16"
          },
          {
            "value": 4,
            "name": "2016-09-19"
          },
          {
            "value": 9,
            "name": "2016-09-24"
          }
        ]
      },
      {
        "name": "Mexico",
        "series": [
          {
            "value": 0,
            "name": "2016-09-18"
          },
          {
            "value": 4,
            "name": "2016-09-20"
          },
          {
            "value": 2,
            "name": "2016-09-16"
          },
          {
            "value": 7,
            "name": "2016-09-19"
          },
          {
            "value": 9,
            "name": "2016-09-24"
          }
        ]
      },
      {
        "name": "Mauritius",
        "series": [
          {
            "value": 3,
            "name": "2016-09-18"
          },
          {
            "value": 6,
            "name": "2016-09-20"
          },
          {
            "value": 8,
            "name": "2016-09-16"
          },
          {
            "value": 3,
            "name": "2016-09-19"
          },
          {
            "value": 7,
            "name": "2016-09-24"
          }
        ]
      }
    ];
  }
  xAxisTicks:any;
  ngOnInit(): void {
    // this.loadData();
    this.colorScheme = this.chartService.trendingItemsChartTheme ? this.chartService.trendingItemsChartTheme : 'air';
  }
  loadData() {
    this.isLoading = true;
    const colstring = this.collectionorCommunityId ? '/getTopViewItemtrading?dateType=' + this.dateType + '&top=10&collectionorcommunityid=' + this.collectionorCommunityId+ '&type='+this.type : '/getTopViewItemtrading?dateType=' + this.dateType + '&top=10'
    this.chartService.findAllByGeolocation(colstring).subscribe((data) => {
      this.isLoading = false;
      this.cdref.detectChanges();
    
      if (data) {
        this.chartOptions = data;
    
        // Extract dates from all series into a single array
        const allDates = [];
        this.chartOptions.forEach((series: any) => {
          series.series.forEach((item: any) => {
            allDates.push(new Date(item.name)); // Extracting date from the "name" field
          });
        });
    
        // Get unique dates
        const uniqueDates = Array.from(new Set(allDates.map(date => date.getTime())))
                                   .map(time => new Date(time)); // Remove duplicates
    
        // Reduce the ticks based on unique dates
        if(uniqueDates.length >20) {
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
    });
  }
  
// Function to reduce ticks
getReducedTicks(dates: Date[]): Date[] {
  if(dates.length> 20) {
    const maxTicks = 10; // Define the maximum number of ticks to show
    const tickInterval = Math.max(1, Math.floor(dates.length / maxTicks)); // Calculate interval
  
    // Filter dates to only include the ones to show on the axis
    return dates.filter((_, index) => index % tickInterval === 0);
  } else {
    return dates;
  }
}


  ngOnChanges(changes: SimpleChanges) {
  this.loadData();
  }

}
