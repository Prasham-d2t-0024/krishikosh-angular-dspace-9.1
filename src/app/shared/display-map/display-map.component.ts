import { ChangeDetectorRef, Component, Input, NgZone, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodataWorldIndiaLow from "@amcharts/amcharts4-geodata/worldIndiaLow";
import am4themesAnimated from "@amcharts/amcharts4/themes/animated";
import { ChartService } from 'src/app/core/shared/trending-charts/chart.service';
import { isEmpty } from 'lodash';
import { CommonModule } from '@angular/common';
am4core.useTheme(am4themesAnimated);

@Component({
  selector: 'ds-display-map',
  templateUrl: './display-map.component.html',
  styleUrls: ['./display-map.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})

export class DisplayMapComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  private defaultColor = "#d9d9d9";
  chart: am4maps.MapChart;
  localAreaData: any;
  imageSeries: am4maps.MapImageSeries;
  categoryColorMap: Map<any, any>;
  customLegendItems: any[] = [];
  mapThemeShades : string[] = ['#5ed0f3ff', '#229bc0ff', '#0a6d8bff', '#004960'];
  mapThemeLabels : string[] = ['< 100 Views', '100 - 500 Views', '500 - 1000 Views', '> 1000 Views'];
  @Input() areaData: any = {};
  @Input() plotData: any = {};
  @Input() dateType: number = 0;
  @Input() height: string = '307px';
  @Input() itemId: string;
  @Input() isLoading: boolean = false;
  @Input() showLegends: boolean = true;
  @Input() id: string = 'mapContainer';

  constructor(
    private zone: NgZone,
    public cdRef: ChangeDetectorRef,
    private chartService: ChartService,
  ) { }

  ngOnInit(): void {
    this.mapThemeShades = this.chartService.mapThemeShades;
    if(this.mapThemeShades){
      this.categoryColorMap = new Map(
        this.mapThemeLabels.map((label, i) => [label, { normal: this.mapThemeShades[i] }])
      );
  
      this.customLegendItems = this.mapThemeLabels.map((label, i) => ({
        label,
        color: this.mapThemeShades[i],
        category: label,
        selected: false
      }));
    }    
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['areaData'] && !changes['areaData'].firstChange && this.chart) {
        this.updateMapData();
    }

    if (changes['plotData'] && !changes['plotData'].firstChange && this.chart) {
      this.updateMarkers();
    }

    if (changes['dateType'] && !changes['dateType'].firstChange && this.chart) {
      if (isEmpty(this.areaData) && this.dateType && this.itemId) {
        this.fetchAndUpdateMapData();
      } 
      if (isEmpty(this.plotData)) {
        this.fetchAndUpdatePlotData();
      }
    }

    if(changes["categoryColorMap"] && !changes["categoryColorMap"].firstChange && this.areaData) {
      this.updateMapData();
    }

  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  createChart(): void {
    this.zone.runOutsideAngular(() => {
      let chart = am4core.create(this.id, am4maps.MapChart);

      chart.logo.disabled = true;
      chart.geodata = am4geodataWorldIndiaLow;
      chart.projection = new am4maps.projections.Miller();

      // Create polygon series for countries
      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.exclude = ["AQ"]; // AQ = Antarctica

      // Add hover state for country highlighting
      let polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.strokeWidth = 0.5;
      polygonTemplate.stroke = am4core.color("#FFFFFF");

      // Create hover state
      polygonTemplate.events.on("over", (event) => {
        const polygon = event.target;
        const polygonData = polygon.dataItem?.dataContext as { category?: string; fill?: any };

        // Only apply hover effect if country doesn't have data (no category or using default color)
        if (!polygonData?.category || polygonData.fill === this.defaultColor) {
          polygon.fill = am4core.color('#b1afafff');
          polygon.stroke = am4core.color("#b1afafff");
          polygon.strokeWidth = 1;
          polygon.strokeOpacity = 0.8;
        }
      });

      polygonTemplate.events.on("out", (event) => {
        const polygon = event.target;
        const polygonData = polygon.dataItem?.dataContext as { category?: string; fill?: any };

        // Restore original color only if country doesn't have data
        if (!polygonData?.category || polygonData.fill === this.defaultColor) {
          polygon.fill = am4core.color(this.defaultColor);
          polygon.stroke = am4core.color("#FFFFFF");
          polygon.strokeWidth = 0.5;
          polygon.strokeOpacity = 1;
        }
      });

      polygonSeries.useGeodata = true;
      polygonSeries.calculateVisualCenter = true;
      polygonSeries.tooltip.getFillFromObject = false;
      polygonSeries.tooltip.background.fill = am4core.color("#000");
      polygonSeries.tooltip.background.opacity = 0.7;
      polygonSeries.tooltip.contextMenuDisabled = true;

      // Set up data fields
      polygonSeries.mapPolygons.template.propertyFields.fill = "fill";
      polygonSeries.mapPolygons.template.tooltipHTML = "{tooltipHTML}";
      polygonSeries.mapPolygons.template.adapter.add("tooltipHTML", (html, target) => {
        const data = target.dataItem?.dataContext as { tooltipHTML?: string; name?: string };
        if (!data?.tooltipHTML) {
          return
        }
        return data.tooltipHTML;
      });

      // Create image series for markers
      this.imageSeries = chart.series.push(new am4maps.MapImageSeries());

      // Create image template for markers
      let imageTemplate = this.imageSeries.mapImages.template;
      imageTemplate.propertyFields.latitude = "latitude";
      imageTemplate.propertyFields.longitude = "longitude";
      imageTemplate.tooltipHTML = "{tooltipHTML}";
      imageTemplate.nonScaling = true;

      let image = imageTemplate.createChild(am4core.Image);
      image.href = "assets/images/marker.png";
      image.width = 16;
      image.height = 16;
      image.horizontalCenter = "middle";
      image.verticalCenter = "bottom";
      image.nonScaling = false;

      // Make markers interactive
      imageTemplate.cursorOverStyle = am4core.MouseCursorStyle.pointer;

      chart.zoomControl = new am4maps.ZoomControl();
      this.chart = chart;

      // Load initial data
      this.updateMapData();
      this.updateMarkers();
    });
  }

  updateMarkers(): void {
    if (!this.chart || !this.imageSeries) {
      return;
    }
    if (!isEmpty(this.plotData)) {
      const formattedMarkers = this.formatPlotDataForMarkers(this.plotData);
      this.imageSeries.data = formattedMarkers;
    }
  }

  fetchAndUpdatePlotData(): void {
    if (!this.chart || !this.imageSeries) return;

    const plotString = '/getTopViewDownloadserchMap?dateType=' + this.dateType + '&top=10&collectionorcommunityid=' + this.itemId + '&type=item';
    this.chartService.findAllByGeolocation(plotString).pipe().subscribe((data) => {
      if (!isEmpty(data)) {
        const formattedMarkers = this.formatPlotDataForMarkers(data);
        this.imageSeries.data = formattedMarkers;
        this.cdRef.detectChanges();
      }
    });
  }

  /**
 * Format plot data for map markers
 */
  formatPlotDataForMarkers(plotData: any): any[] {
    if (!plotData || typeof plotData !== 'object') {
      return [];
    }

    return Object.keys(plotData).map((key, index) => {
      const plot = plotData[key];
      const views = plot.value || plot.views || plot.count || 0;
      const city = plot.city || key;
      const latitude = parseFloat(plot.latitude);
      const longitude = parseFloat(plot.longitude);

      // Determine marker category based on view count
      let category = '< 100 Views';
      if (views > 1000) {
        category = '> 1000 Views';
      } else if (views > 500) {
        category = '500 - 1000 Views';
      } else if (views > 100) {
        category = '100 - 500 Views';
      }

      return {
        id: `marker-${index}`,
        latitude: latitude,
        longitude: longitude,
        title: city,
        views: views,
        category: category,
        tooltipHTML: plot.tooltip?.content || `<strong>${city}</strong><br/>Views: ${views}`,
      };
    });
  }

  updateMapData(): void {
    if (!this.chart) return;

    let polygonSeries = this.chart.series.values.find(s => s instanceof am4maps.MapPolygonSeries) as am4maps.MapPolygonSeries;

    if (!polygonSeries) return;

    if (!isEmpty(this.areaData)) {
      // Use provided areaData
      polygonSeries.data = Object.keys(this.areaData).map(countryId => {
        const countryInfo = this.areaData[countryId];
        const views = countryInfo.value;

        let category;
        if (views < 100) {
          category = "< 100 Views";
        } else if (views <= 500) {
          category = "100 - 500 Views";
        } else if (views <= 1000) {
          category = "500 - 1000 Views";
        } else {
          category = "> 1000 Views";
        }        
        return {
          id: countryId,
          category: category,
          fill: this.getCategoryColor(category),
          tooltipHTML: countryInfo.tooltip.content
        };
      });
    } else {
      this.fetchAndUpdateMapData();
    }
  }

  fetchAndUpdateMapData(): void {
    if (!this.chart) return;

    let polygonSeries = this.chart.series.values.find(s => s instanceof am4maps.MapPolygonSeries) as am4maps.MapPolygonSeries;

    if (!polygonSeries) return;

    const colstring2 = '/getTopViewDownloadserchMapArea?dateType=' + this.dateType + '&top=10&collectionorcommunityid=' + this.itemId + '&type=item';
    this.chartService.findAllByGeolocation(colstring2).pipe().subscribe((data) => {
      this.cdRef.detectChanges();
      if (!isEmpty(data)) {
        this.localAreaData = data;
        polygonSeries.data = Object.keys(this.localAreaData).map(countryId => {
          const countryInfo = this.localAreaData[countryId];
          const views = countryInfo.value;

          let category;
          if (views < 100) {
            category = "< 100 Views";
          } else if (views <= 500) {
            category = "100 - 500 Views";
          } else if (views <= 1000) {
            category = "500 - 1000 Views";
          } else {
            category = "> 1000 Views";
          }
          
          return {
            id: countryId,
            category: category,
            fill: this.getCategoryColor(category),
            tooltipHTML: countryInfo.tooltip.content
          };
        });
      }
    });
  }

  // Custom legend click handler
  onCustomLegendClick(item: any) {
    if (item.selected) {
      this.resetCustomLegendSelection();
      return;
    }

    // Deselect all items
    this.customLegendItems.forEach(i => i.selected = false);

    // Select clicked item
    item.selected = true;

    // Get the polygon series from the chart
    if (this.chart) {
      let polygonSeries = this.chart.series.values.find(s => s instanceof am4maps.MapPolygonSeries) as am4maps.MapPolygonSeries;

      if (polygonSeries) {
        polygonSeries.mapPolygons.each((polygon) => {
          let polygonData = polygon.dataItem.dataContext as { category?: string };

          if (polygonData && polygonData.category === item.category) {
            // Highlight selected category
            polygon.fill = am4core.color(item.color);
            polygon.fillOpacity = 1;
            polygon.stroke = am4core.color("#FFFFFF");
            polygon.strokeWidth = 1;
          } else {
            // Dim other countries
            polygon.fill = am4core.color(this.defaultColor);
            polygon.fillOpacity = 0.3;
            polygon.stroke = am4core.color("#FFFFFF");
            polygon.strokeWidth = 0.5;
          }
        });
      }
    }
  }

  // Reset custom legend selection
  resetCustomLegendSelection() {
    this.customLegendItems.forEach(i => i.selected = false);

    if (this.chart) {
      let polygonSeries = this.chart.series.values.find(s => s instanceof am4maps.MapPolygonSeries) as am4maps.MapPolygonSeries;

      if (polygonSeries) {
        polygonSeries.mapPolygons.each((polygon) => {
          let polygonData = polygon.dataItem.dataContext as { category?: string };

          if (polygonData && polygonData.category) {
            polygon.fill = this.getCategoryColor(polygonData.category);
          } else {
            polygon.fill = am4core.color(this.defaultColor);
          }

          polygon.fillOpacity = 1;
          polygon.stroke = am4core.color("#FFFFFF");
          polygon.strokeWidth = 0.5;
        });
      }
    }
  }

  getCategoryColor(category: string): any {
    const colorData = this.categoryColorMap.get(category);
    if (colorData) {
      return am4core.color(colorData.normal);
    }
    return am4core.color(this.defaultColor);
  }

  ngOnDestroy(): void {
    this.zone.runOutsideAngular(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
  }

}