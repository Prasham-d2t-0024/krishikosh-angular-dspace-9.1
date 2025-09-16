import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ChartService } from 'src/app/core/shared/trending-charts/chart.service';

@Component({
  selector: 'ds-home-bar-chart',
  standalone: true,
  imports: [
    NgxChartsModule,
    TranslateModule
  ],
  templateUrl: './home-bar-chart.component.html',
  styleUrl: './home-bar-chart.component.scss'
})
export class HomeBarChartComponent {
  @Input() collectionorCommunityId: string;
  @Input() dateType;
  @Input() type;
  view: any[] = [550, 425];
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
  data: any = [];
  init: boolean = false;
  isLoading: boolean = false;
  @Input() barChartOptions: string;

  colorScheme = {
    domain: ['#004960', '#00958f']
  };
  schemeType: string = 'ordinal';
  themeColors:any = {};

  constructor(
    public chartService: ChartService,
    public cdref: ChangeDetectorRef,
    private http: HttpClient
  ) {
    
  }
  ngOnInit(): void {
    this.colorScheme = {
      domain: [ this.chartService.primaryColor, this.chartService.secondaryColor ]
    }    
  }

  loadData() {
    this.isLoading = true;
    const colstring = this.collectionorCommunityId ? '/getMostViewBarchart?dateType=' + this.dateType +
      '&top=10&collectionorcommunityid=' + this.collectionorCommunityId + '&type=' + this.type :
      '/getMostViewBarchart?dateType=' +
      this.dateType + '&top=10'
    this.chartService.findAllByGeolocation(colstring).pipe().subscribe((data) => {
      this.isLoading = false;
      this.cdref.detectChanges();
      if (data) {
        this.chartOptions = data;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.loadData();
  }
}
