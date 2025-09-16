import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { map, Observable, take } from 'rxjs';
import { ItemDataService } from 'src/app/core/data/item-data.service';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { Item } from 'src/app/core/shared/item.model';
import { Chart } from 'src/app/core/shared/trending-charts/chart.model';
import { ChartService } from 'src/app/core/shared/trending-charts/chart.service';
import { ViewMode } from 'src/app/core/shared/view-mode.model';
import { ListableObjectComponentLoaderComponent } from 'src/app/shared/object-collection/shared/listable-object/listable-object-component-loader.component';
import { followLink, FollowLinkConfig } from 'src/app/shared/utils/follow-link-config.model';
import { HomeLineChartComponent } from '../home-line-chart/home-line-chart.component';
import { HomeBarChartComponent } from '../home-bar-chart/home-bar-chart.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthorizationDataService } from 'src/app/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from 'src/app/core/data/feature-authorization/feature-id';
import { AuthService } from 'src/app/core/auth/auth.service';
import { hasValue } from 'src/app/shared/empty.util';
import { URLCombiner } from 'src/app/core/url-combiner/url-combiner';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'ds-home-trending-item',
  standalone: true,
  imports: [
    TranslateModule,
    NgxChartsModule,
    ListableObjectComponentLoaderComponent,
    HomeLineChartComponent,
    HomeBarChartComponent,
    NgbTooltipModule,
    AsyncPipe
  ],
  templateUrl: './home-trending-item.component.html',
  styleUrl: './home-trending-item.component.scss'
})
export class HomeTrendingItemComponent {
  @Input() collectionorCommunityId;
  @Input() type;
  cardChartdata = [];
  lineChartdata = [];
  barChartOptions: Observable<RemoteData<PaginatedList<Chart>>>;
  i: number = 0;
  num: number = 0;
  chartOptions: any = [
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
  timeline: boolean = true;
  view: any[] = [200, 150];
  colorScheme = {
    domain: ['#004960']
  };
  colorScheme1 = {
    domain: ['#00958f']
  };
  viewMode = ViewMode.ListElement;
  cardData: any = [];
  isLoading: boolean = false;
  /**
   * Whether the current user is an admin or not
   */
  isAdmin$: Observable<boolean>;
  constructor(
    public chartService: ChartService,
    public cdRef: ChangeDetectorRef,
    private itemdataservice: ItemDataService,
    protected authorizationService: AuthorizationDataService,
    private authService: AuthService,
  ) { }
  @ViewChild('viewschart1') viewsChartElement: ElementRef; // Reference to the div
  object: any;
  object$: Observable<any>;

  ngAfterViewInit() {
    if (this.viewsChartElement) {
      this.getViewData(this.object); // Call the method when the div is loaded
    }

  }
  ngOnInit(): void {
    this.colorScheme = {
      domain: [this.chartService.primaryColor]
    };
    this.colorScheme1 = {
      domain: [this.chartService.secondaryColor]
    };
    this.loadData();
    this.isAdmin$ = this.authorizationService.isAuthorized(FeatureID.AdministratorOf);
  }

  loadData(): void {
    this.isLoading = true;
    const apiEndPoint = this.collectionorCommunityId
      ? `/getTopViewItemCount?dateType=${this.i}&top=10&collectionorcommunityid=${this.collectionorCommunityId}&type=${this.type}`
      : `/getTopViewItemCount?dateType=${this.i}&top=10`;

    this.itemdataservice.searchBy(apiEndPoint).subscribe((data) => {
      this.isLoading = false;
      if (data && data?.payload?.page) {
        this.cardData = data.payload.page;
        this.cardData.map((item: any)=>{
          item['downloadData'] = this.transformChartData(item.itemCardData?.downlodeDatapoint);
          item['viewData'] = this.transformChartData(item.itemCardData?.viewDataPoint);
        })
      }
      this.cdRef.detectChanges();
    },(error)=>{
      this.isLoading = false;
      console.error('Error fetching chart data:', error);
      this.cdRef.detectChanges();
    })
  }

  /**
   * Helper function to transform chart data into unique series format
   */
  private transformChartData(data: any): { name: string; value: number }[] | null {
    if (!data?.series || !Array.isArray(data.series)) {
      return null;
    }

    const uniqueSeries: { name: string; value: number }[] = [];

    data.series.forEach((entry: any) => {
      const existingEntry = uniqueSeries.find(e => e.name === entry.name);

      if (existingEntry) {
        existingEntry.value += Number(entry.value);
      } else {
        uniqueSeries.push({
          name: entry.name,
          value: Number(entry.value),
        });
      }
    });

    return uniqueSeries;
  }


  buttonClick(j) {
    this.i = j;
    this.loadData();
  }

  linksToFollow: FollowLinkConfig<Item>[] = [followLink('thumbnail')];

  castingObject(item: any) {
    return this.itemdataservice.findById(item.id, true, true, ...this.linksToFollow);
  }

  getViewData(object) {
    if (!!object.itemCardData.viewDataPoint) {
      const data = object.itemCardData.viewDataPoint
      if (data && data['series'] && Array.isArray(data['series'])) {
        // Group by date and sum values if needed, or keep each date entry as-is.
        const uniqueSeries = [];

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
        const chartData = [
          {
            name: data['name'],
            series: uniqueSeries
          }
        ];
        this.chartOptions = chartData;
      }

    }
  }

  getDownloadData(object) {
    if (this.num !== 2) {
      this.num = 2;
      if (!!object.itemCardData.downlodeDatapoint) {
        const data = object.itemCardData.downlodeDatapoint;
        if (data && data['series'] && Array.isArray(data['series'])) {
          // Group by date and sum values if needed, or keep each date entry as-is.
          const uniqueSeries = [];

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
          const chartOptions = [
            {
              name: data['name'],
              series: uniqueSeries
            }
          ];
          return chartOptions;
        }
      }

    }
  }

  downloadExcel() {
    this.chartService.downloadZIP().subscribe((data: any) => {
      // window.open(data + '/report/downloadTrandingReport&dateType=' + this.i);
      this.authService.getShortlivedToken().pipe(take(1), map((token) =>
        hasValue(token) ? new URLCombiner(data + '/report/downloadTrandingReport?dateType=' + this.i, `&authentication-token=${token}`).toString() : data + '/report/downloadTrandingReport?dateType=' + this.i)).subscribe((logs: string) => {
        window.open(logs);
      });
    },
      (error) => {
        console.error('Error downloading the ZIP file', error);
      })
  }
}
